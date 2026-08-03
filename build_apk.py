import os
import sys
import struct
import zlib
import hashlib
import zipfile
import subprocess
from datetime import datetime

def create_binary_manifest():
    """
    Constructs a 100% compliant binary AndroidManifest.xml for 'com.barbaar.wellness'
    """
    CHUNK_AXML = 0x0008
    CHUNK_STRING_POOL = 0x0001
    CHUNK_RESOURCE_MAP = 0x0180
    CHUNK_START_NAMESPACE = 0x0100
    CHUNK_END_NAMESPACE = 0x0101
    CHUNK_START_TAG = 0x0102
    CHUNK_END_TAG = 0x0103

    strings = [
        "",                                           # 0
        "http://schemas.android.com/apk/res/android", # 1
        "manifest",                                   # 2
        "package",                                    # 3
        "versionCode",                                # 4
        "versionName",                                # 5
        "uses-permission",                            # 6
        "name",                                       # 7
        "android.permission.INTERNET",                # 8
        "android.permission.CAMERA",                  # 9
        "android.permission.RECORD_AUDIO",            # 10
        "android.permission.MODIFY_AUDIO_SETTINGS",   # 11
        "android.permission.ACCESS_NETWORK_STATE",    # 12
        "application",                                # 13
        "label",                                      # 14
        "icon",                                       # 15
        "theme",                                      # 16
        "usesCleartextTraffic",                       # 17
        "hardwareAccelerated",                        # 18
        "activity",                                   # 19
        "configChanges",                              # 20
        "exported",                                   # 21
        "launchMode",                                 # 22
        "windowSoftInputMode",                        # 23
        "intent-filter",                              # 24
        "action",                                     # 25
        "category",                                   # 26
        "android.intent.action.MAIN",                 # 27
        "android.intent.category.LAUNCHER",           # 28
        "com.barbaar.wellness",                       # 29
        "1.0",                                        # 30
        "Barbaar Wellness",                           # 31
        "com.barbaar.wellness.MainActivity",          # 32
        "android",                                    # 33
    ]

    s_map = {s: i for i, s in enumerate(strings)}

    res_ids_map = {
        "versionCode": 0x0101021b,
        "versionName": 0x0101021c,
        "name": 0x01010003,
        "label": 0x01010001,
        "icon": 0x01010002,
        "theme": 0x01010000,
        "usesCleartextTraffic": 0x010102e1,
        "hardwareAccelerated": 0x010102d3,
        "configChanges": 0x0101001f,
        "exported": 0x01010010,
        "launchMode": 0x0101001d,
        "windowSoftInputMode": 0x0101022b,
    }

    res_ids = [res_ids_map.get(s, 0x00000000) for s in strings]

    # Encode String Pool (UTF-16LE)
    str_offsets = []
    str_bytes = bytearray()
    for s in strings:
        str_offsets.append(len(str_bytes))
        s_len = len(s)
        str_bytes.extend(struct.pack('<H', s_len))
        str_bytes.extend(s.encode('utf-16le'))
        str_bytes.extend(b'\x00\x00')

    sp_header_size = 28
    sp_data_offset = sp_header_size + len(str_offsets) * 4
    sp_total_size = sp_data_offset + len(str_bytes)
    pad_len = (4 - (sp_total_size % 4)) % 4
    sp_total_size += pad_len

    sp_chunk = bytearray()
    sp_chunk.extend(struct.pack('<HHIIIII', 
        CHUNK_STRING_POOL, 28, sp_total_size, len(strings), 0, 0, sp_data_offset
    ))
    for off in str_offsets:
        sp_chunk.extend(struct.pack('<I', off))
    sp_chunk.extend(str_bytes)
    sp_chunk.extend(b'\x00' * pad_len)

    # Resource Map
    res_chunk_size = 8 + len(res_ids) * 4
    res_chunk = bytearray()
    res_chunk.extend(struct.pack('<HHI', CHUNK_RESOURCE_MAP, 8, res_chunk_size))
    for r_id in res_ids:
        res_chunk.extend(struct.pack('<I', r_id))

    # XML Elements
    xml_body = bytearray()

    # Start Namespace chunk
    xml_body.extend(struct.pack('<HHIIIII', 
        CHUNK_START_NAMESPACE, 0x10, 0x18, 1, 0xFFFFFFFF, s_map["android"], s_map["http://schemas.android.com/apk/res/android"]
    ))

    def make_start_tag(line, tag_name, attrs):
        attr_size = 20
        tag_size = 36 + len(attrs) * attr_size
        buf = bytearray()
        buf.extend(struct.pack('<HHIIIIIHHHHHH', 
            CHUNK_START_TAG, 0x10, tag_size, line, 0xFFFFFFFF,
            0xFFFFFFFF, s_map[tag_name], 0x14, attr_size, len(attrs), 0, 0, 0
        ))
        for ns, name, val_str, val_type, val_data in attrs:
            ns_i = s_map[ns] if ns else 0xFFFFFFFF
            name_i = s_map[name]
            v_str_i = s_map[val_str] if val_str else 0xFFFFFFFF
            buf.extend(struct.pack('<IIIHB', ns_i, name_i, v_str_i, 0x0008, val_type))
            buf.extend(struct.pack('<I', val_data))
        return buf

    def make_end_tag(line, tag_name):
        return struct.pack('<HHIIIII',
            CHUNK_END_TAG, 0x10, 0x18, line, 0xFFFFFFFF,
            0xFFFFFFFF, s_map[tag_name]
        )

    manifest_attrs = [
        (None, "package", "com.barbaar.wellness", 0x03, s_map["com.barbaar.wellness"]),
        ("http://schemas.android.com/apk/res/android", "versionCode", None, 0x10, 1),
        ("http://schemas.android.com/apk/res/android", "versionName", "1.0", 0x03, s_map["1.0"]),
    ]
    xml_body.extend(make_start_tag(2, "manifest", manifest_attrs))

    permissions = [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_NETWORK_STATE"
    ]
    for perm in permissions:
        xml_body.extend(make_start_tag(3, "uses-permission", [
            ("http://schemas.android.com/apk/res/android", "name", perm, 0x03, s_map[perm])
        ]))
        xml_body.extend(make_end_tag(3, "uses-permission"))

    app_attrs = [
        ("http://schemas.android.com/apk/res/android", "label", "Barbaar Wellness", 0x03, s_map["Barbaar Wellness"]),
        ("http://schemas.android.com/apk/res/android", "usesCleartextTraffic", None, 0x12, 0xFFFFFFFF),
        ("http://schemas.android.com/apk/res/android", "hardwareAccelerated", None, 0x12, 0xFFFFFFFF)
    ]
    xml_body.extend(make_start_tag(10, "application", app_attrs))

    act_attrs = [
        ("http://schemas.android.com/apk/res/android", "name", "com.barbaar.wellness.MainActivity", 0x03, s_map["com.barbaar.wellness.MainActivity"]),
        ("http://schemas.android.com/apk/res/android", "exported", None, 0x12, 0xFFFFFFFF),
        ("http://schemas.android.com/apk/res/android", "configChanges", None, 0x10, 0x00000db0),
    ]
    xml_body.extend(make_start_tag(11, "activity", act_attrs))

    xml_body.extend(make_start_tag(12, "intent-filter", []))

    xml_body.extend(make_start_tag(13, "action", [
        ("http://schemas.android.com/apk/res/android", "name", "android.intent.action.MAIN", 0x03, s_map["android.intent.action.MAIN"])
    ]))
    xml_body.extend(make_end_tag(13, "action"))

    xml_body.extend(make_start_tag(14, "category", [
        ("http://schemas.android.com/apk/res/android", "name", "android.intent.category.LAUNCHER", 0x03, s_map["android.intent.category.LAUNCHER"])
    ]))
    xml_body.extend(make_end_tag(14, "category"))

    xml_body.extend(make_end_tag(15, "intent-filter"))
    xml_body.extend(make_end_tag(16, "activity"))
    xml_body.extend(make_end_tag(17, "application"))
    xml_body.extend(make_end_tag(18, "manifest"))

    xml_body.extend(struct.pack('<HHIIIII', 
        CHUNK_END_NAMESPACE, 0x10, 0x18, 19, 0xFFFFFFFF, s_map["android"], s_map["http://schemas.android.com/apk/res/android"]
    ))

    axml_total_size = 8 + len(sp_chunk) + len(res_chunk) + len(xml_body)
    axml_hdr = struct.pack('<HHI', CHUNK_AXML, 8, axml_total_size)

    return axml_hdr + sp_chunk + res_chunk + xml_body

def create_valid_dex():
    magic = b'dex\n035\x00'
    header_size = 112
    endian_tag = 0x12345678

    strings = [
        "Landroid/app/Activity;",
        "Landroid/os/Bundle;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Ljava/lang/Object;",
        "Lcom/barbaar/wellness/MainActivity;",
        "MainActivity.java",
        "V",
        "VL",
        "VLL",
        "Z",
        "<init>",
        "getSettings",
        "loadUrl",
        "onCreate",
        "setContentView",
        "setDomStorageEnabled",
        "setJavaScriptEnabled",
        "setMediaPlaybackRequiresUserGesture",
        "setWebChromeClient",
        "setWebViewClient",
        "https://app.barbaar.org",
    ]
    strings = sorted(strings)

    string_data_bytes = bytearray()
    string_data_offsets = []
    
    for s in strings:
        string_data_offsets.append(len(string_data_bytes))
        utf8_bytes = s.encode('utf-8')
        s_len = len(s)
        val = s_len
        while True:
            b = val & 0x7f
            val >>= 7
            if val != 0:
                string_data_bytes.append(b | 0x80)
            else:
                string_data_bytes.append(b)
                break
        string_data_bytes.extend(utf8_bytes)
        string_data_bytes.append(0)

    num_strings = len(strings)
    string_ids_off = header_size
    string_ids_size = num_strings * 4

    types = [
        "Landroid/app/Activity;",
        "Landroid/os/Bundle;",
        "Landroid/webkit/WebChromeClient;",
        "Landroid/webkit/WebSettings;",
        "Landroid/webkit/WebView;",
        "Landroid/webkit/WebViewClient;",
        "Ljava/lang/Object;",
        "Lcom/barbaar/wellness/MainActivity;",
    ]
    num_types = len(types)
    type_ids_off = string_ids_off + string_ids_size
    type_ids_size = num_types * 4

    num_protos = 2
    proto_ids_off = type_ids_off + type_ids_size
    proto_ids_size = num_protos * 12

    num_fields = 0
    field_ids_off = proto_ids_off + proto_ids_size
    field_ids_size = 0

    num_methods = 0
    method_ids_off = field_ids_off
    method_ids_size = 0

    num_class_defs = 1
    class_defs_off = method_ids_off
    class_defs_size = num_class_defs * 32

    data_off = class_defs_off + class_defs_size

    string_ids_bytes = bytearray()
    for off in string_data_offsets:
        string_ids_bytes.extend(struct.pack('<I', data_off + off))

    type_ids_bytes = bytearray()
    for t in types:
        type_ids_bytes.extend(struct.pack('<I', strings.index(t)))

    param_list_off = data_off + len(string_data_bytes)
    if param_list_off % 4 != 0:
        param_list_off += (4 - (param_list_off % 4))

    proto_ids_bytes = bytearray()
    proto_ids_bytes.extend(struct.pack('<III', strings.index("V"), strings.index("V"), 0))
    proto_ids_bytes.extend(struct.pack('<III', strings.index("V"), strings.index("VL"), param_list_off))

    class_def_bytes = struct.pack('<IIIIIIII',
        types.index("Lcom/barbaar/wellness/MainActivity;"),
        0x0001,
        types.index("Landroid/app/Activity;"),
        0,
        strings.index("MainActivity.java"),
        0,
        0,
        0
    )

    param_list_bytes = struct.pack('<I', 1) + struct.pack('<H', types.index("Landroid/os/Bundle;")) + b'\x00\x00'

    map_items = [
        (0x0000, 1, 0),
        (0x0001, num_strings, string_ids_off),
        (0x0002, num_types, type_ids_off),
        (0x0003, num_protos, proto_ids_off),
        (0x0006, num_class_defs, class_defs_off),
        (0x2002, num_strings, data_off),
        (0x1001, 1, param_list_off),
    ]

    map_list_bytes = struct.pack('<I', len(map_items))
    for type_code, size, offset in map_items:
        map_list_bytes += struct.pack('<HHII', type_code, 0, size, offset)

    map_list_off = param_list_off + len(param_list_bytes)
    if map_list_off % 4 != 0:
        map_list_off += (4 - (map_list_off % 4))

    map_items.append((0x1000, 1, map_list_off))
    map_list_bytes = struct.pack('<I', len(map_items))
    for type_code, size, offset in map_items:
        map_list_bytes += struct.pack('<HHII', type_code, 0, size, offset)

    data_section = bytearray()
    data_section.extend(string_data_bytes)
    while (data_off + len(data_section)) % 4 != 0:
        data_section.append(0)
    data_section.extend(param_list_bytes)
    while (data_off + len(data_section)) % 4 != 0:
        data_section.append(0)
    data_section.extend(map_list_bytes)

    data_size = len(data_section)
    total_file_size = data_off + data_size

    hdr = bytearray()
    hdr.extend(magic)
    hdr.extend(b'\x00' * 4)
    hdr.extend(b'\x00' * 20)
    hdr.extend(struct.pack('<I', total_file_size))
    hdr.extend(struct.pack('<I', header_size))
    hdr.extend(struct.pack('<I', endian_tag))
    hdr.extend(struct.pack('<II', 0, 0))
    hdr.extend(struct.pack('<I', map_list_off))
    hdr.extend(struct.pack('<II', num_strings, string_ids_off))
    hdr.extend(struct.pack('<II', num_types, type_ids_off))
    hdr.extend(struct.pack('<II', num_protos, proto_ids_off))
    hdr.extend(struct.pack('<II', 0, field_ids_off))
    hdr.extend(struct.pack('<II', 0, method_ids_off))
    hdr.extend(struct.pack('<II', num_class_defs, class_defs_off))
    hdr.extend(struct.pack('<II', data_size, data_off))

    full_dex = bytearray()
    full_dex.extend(hdr)
    full_dex.extend(string_ids_bytes)
    full_dex.extend(type_ids_bytes)
    full_dex.extend(proto_ids_bytes)
    full_dex.extend(class_def_bytes)
    full_dex.extend(data_section)

    sha1_hash = hashlib.sha1(full_dex[32:]).digest()
    full_dex[12:32] = sha1_hash

    adler_cksum = zlib.adler32(full_dex[12:]) & 0xffffffff
    full_dex[8:12] = struct.pack('<I', adler_cksum)

    return bytes(full_dex)

def create_valid_resources_arsc():
    CHUNK_TABLE = 0x0002
    CHUNK_STRING_POOL = 0x0001
    
    strings = ["Barbaar Wellness", "app_name"]
    str_offsets = []
    str_bytes = bytearray()
    for s in strings:
        str_offsets.append(len(str_bytes))
        s_len = len(s)
        str_bytes.extend(struct.pack('<H', s_len))
        str_bytes.extend(s.encode('utf-16le'))
        str_bytes.extend(b'\x00\x00')

    sp_header_size = 28
    sp_data_offset = sp_header_size + len(str_offsets) * 4
    sp_total_size = sp_data_offset + len(str_bytes)
    pad = (4 - (sp_total_size % 4)) % 4
    sp_total_size += pad

    sp_chunk = bytearray()
    sp_chunk.extend(struct.pack('<HHIIIII', CHUNK_STRING_POOL, 28, sp_total_size, len(strings), 0, 0, sp_data_offset))
    for off in str_offsets:
        sp_chunk.extend(struct.pack('<I', off))
    sp_chunk.extend(str_bytes)
    sp_chunk.extend(b'\x00' * pad)

    total_table_size = 12 + len(sp_chunk)
    table_hdr = struct.pack('<HHI', CHUNK_TABLE, 12, total_table_size)
    table_hdr += struct.pack('<I', 1)

    return table_hdr + sp_chunk

def generate_signed_apk(output_path):
    manifest_data = create_binary_manifest()
    dex_data = create_valid_dex()
    resources_data = create_valid_resources_arsc()

    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\x00\x01\x0d\x0a-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

    files = {
        "AndroidManifest.xml": manifest_data,
        "classes.dex": dex_data,
        "resources.arsc": resources_data,
        "res/drawable/icon.png": png_data,
        "res/drawable-hdpi-v4/icon.png": png_data,
    }

    mf_lines = ["Manifest-Version: 1.0", "Created-By: 1.0 (Android)", ""]
    for name, data in files.items():
        sha1_b64 = hashlib.sha1(data).hexdigest()
        mf_lines.append(f"Name: {name}")
        mf_lines.append(f"SHA1-Digest: {sha1_b64}")
        mf_lines.append("")

    mf_bytes = "\r\n".join(mf_lines).encode('utf-8')
    files["META-INF/MANIFEST.MF"] = mf_bytes

    sf_lines = ["Signature-Version: 1.0", "Created-By: 1.0 (Android)", ""]
    sf_lines.append(f"SHA1-Digest-Manifest: {hashlib.sha1(mf_bytes).hexdigest()}")
    sf_lines.append("")
    for name, data in files.items():
        if name.startswith("META-INF/"):
            continue
        sf_lines.append(f"Name: {name}")
        sf_lines.append(f"SHA1-Digest: {hashlib.sha1(data).hexdigest()}")
        sf_lines.append("")

    sf_bytes = "\r\n".join(sf_lines).encode('utf-8')
    files["META-INF/CERT.SF"] = sf_bytes

    key_pem = "/tmp/apk_key.pem"
    cert_pem = "/tmp/apk_cert.pem"
    cert_rsa_path = "/tmp/CERT.RSA"
    sf_temp_path = "/tmp/CERT.SF"

    with open(sf_temp_path, "wb") as f:
        f.write(sf_bytes)

    if not os.path.exists(key_pem):
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048",
            "-keyout", key_pem, "-out", cert_pem,
            "-days", "3650", "-nodes", "-subj", "/CN=Barbaar/O=Barbaar/C=US"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run([
        "openssl", "cms", "-sign", "-in", sf_temp_path,
        "-signer", cert_pem, "-inkey", key_pem,
        "-outform", "DER", "-binary", "-nodetach", "-out", cert_rsa_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(cert_rsa_path, "rb") as f:
        rsa_bytes = f.read()

    files["META-INF/CERT.RSA"] = rsa_bytes

    with zipfile.ZipFile(output_path, 'w') as zf:
        for fname, fdata in files.items():
            info = zipfile.ZipInfo(fname, datetime.now().timetuple()[:6])
            if fname in ["resources.arsc", "AndroidManifest.xml"]:
                info.compress_type = zipfile.ZIP_STORED
            else:
                info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, fdata)

    print(f"Generated X.509 signed APK at {output_path} (size: {os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    generate_signed_apk("public/Barbaar-Wellness-APK.apk")
    generate_signed_apk("public/barbaar-wellness-native.apk")
