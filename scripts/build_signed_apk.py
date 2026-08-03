import os
import shutil
import zipfile
import subprocess

def run(cmd):
    print(f"Executing: {cmd}")
    env = os.environ.copy()
    env["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"
    env["PATH"] = f"/usr/lib/jvm/java-17-openjdk-amd64/bin:{env.get('PATH', '')}"
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if res.returncode != 0:
        print(f"Command failed:\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}")
        raise Exception(f"Command failed: {cmd}")
    print(res.stdout)
    return res.stdout

def main():
    os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"
    os.environ["PATH"] = f"/usr/lib/jvm/java-17-openjdk-amd64/bin:{os.environ.get('PATH', '')}"
    root_dir = os.getcwd()
    apk_src = os.path.join(root_dir, "public", "Barbaar-Wellness-APK.apk")
    extracted_dir = "/tmp/apk_extracted"
    
    if os.path.exists(extracted_dir):
        shutil.rmtree(extracted_dir)
    os.makedirs(extracted_dir, exist_ok=True)

    print("Unpacking original APK...")
    with zipfile.ZipFile(apk_src, 'r') as zip_ref:
        zip_ref.extractall(extracted_dir)

    # 1. Update assets/capacitor.config.json
    cap_config_path = os.path.join(extracted_dir, "assets", "capacitor.config.json")
    if os.path.exists(cap_config_path):
        cap_config_content = """{
	"appId": "com.barbaar.wellness",
	"appName": "Barbaar Wellness",
	"webDir": "dist",
	"server": {
		"url": "https://app.barbaar.org",
		"allowNavigation": [
			"*.barbaar.org",
			"app.barbaar.org"
		],
		"cleartext": true
	}
}
"""
        with open(cap_config_path, "w") as f:
            f.write(cap_config_content)
        print("Updated assets/capacitor.config.json with https://app.barbaar.org")

    # 2. Update assets/public with latest dist web assets
    dist_dir = os.path.join(root_dir, "dist")
    apk_public_dir = os.path.join(extracted_dir, "assets", "public")
    if os.path.exists(apk_public_dir):
        shutil.rmtree(apk_public_dir)
    shutil.copytree(dist_dir, apk_public_dir)
    print("Updated assets/public with latest dist build")

    # 3. Update icon images in res/mipmap-*
    icon_mappings = {
        "mipmap-mdpi-v4": "mipmap-mdpi",
        "mipmap-hdpi-v4": "mipmap-hdpi",
        "mipmap-xhdpi-v4": "mipmap-xhdpi",
        "mipmap-xxhdpi-v4": "mipmap-xxhdpi",
        "mipmap-xxxhdpi-v4": "mipmap-xxxhdpi"
    }

    res_dir = os.path.join(extracted_dir, "res")
    for apk_mipmap_folder, src_mipmap_folder in icon_mappings.items():
        src_folder_path = os.path.join(root_dir, "android", "app", "src", "main", "res", src_mipmap_folder)
        target_folder_path = os.path.join(res_dir, apk_mipmap_folder)
        
        if os.path.exists(src_folder_path) and os.path.exists(target_folder_path):
            for icon_name in ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]:
                src_icon = os.path.join(src_folder_path, icon_name)
                target_icon = os.path.join(target_folder_path, icon_name)
                if os.path.exists(src_icon):
                    shutil.copy2(src_icon, target_icon)
                    print(f"Copied {icon_name} to {apk_mipmap_folder}")

    # 4. Remove existing META-INF signature directory completely
    meta_inf_dir = os.path.join(extracted_dir, "META-INF")
    if os.path.exists(meta_inf_dir):
        shutil.rmtree(meta_inf_dir)
        print("Removed existing META-INF directory completely")

    # 5. Pack into unaligned zip (resources.arsc and .so files MUST be stored uncompressed with -0)
    unaligned_apk = "/tmp/unaligned.apk"
    if os.path.exists(unaligned_apk):
        os.remove(unaligned_apk)

    print("Zipping modified files into unaligned APK...")
    with zipfile.ZipFile(unaligned_apk, 'w') as zout:
        for root, _, files in os.walk(extracted_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, extracted_dir)
                # Android requires resources.arsc and .so files to be stored uncompressed (ZIP_STORED) for zipalign
                if rel_path == "resources.arsc" or rel_path.endswith(".so"):
                    zout.write(full_path, rel_path, compress_type=zipfile.ZIP_STORED)
                else:
                    zout.write(full_path, rel_path, compress_type=zipfile.ZIP_DEFLATED)

    # 6. Generate persistent debug keystore in scripts/
    keystore_path = os.path.join(root_dir, "scripts", "barbaar_debug.keystore")
    if not os.path.exists(keystore_path):
        print("Generating persistent debug keystore...")
        run(f"keytool -genkey -v -keystore {keystore_path} -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Android Debug,O=Android,C=US'")

    # 7. Sign APK with apksigner or jarsigner
    if shutil.which("apksigner") and shutil.which("zipalign"):
        aligned_apk = "/tmp/aligned.apk"
        if os.path.exists(aligned_apk):
            os.remove(aligned_apk)
        print("Aligning APK with zipalign...")
        run(f"zipalign -v -f 4 {unaligned_apk} {aligned_apk}")
        print("Signing APK with apksigner (v1 + v2 + v3)...")
        run(f"apksigner sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --ks {keystore_path} --ks-pass pass:android --key-pass pass:android {aligned_apk}")
        print("Verifying APK signature...")
        run(f"apksigner verify {aligned_apk}")
        shutil.copy2(aligned_apk, apk_src)
    else:
        print("Signing APK with jarsigner...")
        run(f"jarsigner -keystore {keystore_path} -storepass android -keypass android {unaligned_apk} androiddebugkey")
        shutil.copy2(unaligned_apk, apk_src)

    print(f"SUCCESS! New signed APK written to {apk_src} (Size: {os.path.getsize(apk_src)} bytes)")

if __name__ == "__main__":
    main()
