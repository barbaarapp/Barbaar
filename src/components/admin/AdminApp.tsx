/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BarChart3, Users, CalendarDays, FileText, Shield } from "lucide-react";
import { Therapist, Booking, AppContent } from "../../types";
import { colors } from "../../constants";
import DashboardShell from "../layout/DashboardShell";
import AdminOverview from "./AdminOverview";
import AdminTherapists from "./AdminTherapists";
import AdminBookingsView from "./AdminBookingsView";
import AdminContent from "./AdminContent";

interface AdminAppProps {
  therapists: Therapist[];
  bookings: Booking[];
  content: AppContent;
  saveTherapists: (therapists: Therapist[]) => void;
  saveBookings: (bookings: Booking[]) => void;
  saveContent: (content: AppContent) => void;
  onExit: () => void;
  screen?: string;
  setScreen?: (screen: string) => void;
  users?: any[];
  onUpdateUserAidStatus?: (userId: string, status: "approved" | "rejected") => Promise<void>;
}

export default function AdminApp({
  therapists,
  bookings,
  content,
  saveTherapists,
  saveBookings,
  saveContent,
  onExit,
  screen: externalScreen,
  setScreen: externalSetScreen,
  users = [],
  onUpdateUserAidStatus,
}: AdminAppProps) {
  const [internalScreen, setInternalScreen] = useState<string>("overview");
  const screen = externalScreen !== undefined ? externalScreen : internalScreen;
  const setScreen = externalSetScreen !== undefined ? externalSetScreen : setInternalScreen;

  const items = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "therapists", label: "Therapists", icon: Users },
    { key: "bookings", label: "Bookings", icon: CalendarDays },
    { key: "content", label: "App content", icon: FileText },
  ];

  return (
    <DashboardShell
      title="Admin"
      items={items}
      active={screen}
      go={setScreen}
      onExit={onExit}
      exitLabel="Switch role"
      badge={
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: colors.indigoDeep,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={16} />
        </div>
      }
    >
      {screen === "overview" && <AdminOverview therapists={therapists} bookings={bookings} />}
      {screen === "therapists" && (
        <AdminTherapists therapists={therapists} onSave={saveTherapists} />
      )}
      {screen === "bookings" && (
        <AdminBookingsView
          therapists={therapists}
          bookings={bookings}
          onSaveBookings={saveBookings}
          users={users}
          onUpdateUserAidStatus={onUpdateUserAidStatus}
        />
      )}
      {screen === "content" && <AdminContent content={content} onSave={saveContent} />}
    </DashboardShell>
  );
}
