import "server-only";
import type { StaffMember } from "@/lib/schema";
import { listStaffMembers } from "@/lib/services/staff.service";

export type RepairTechnician = Pick<StaffMember, "id" | "name" | "email" | "phone" | "status" | "isRepairTechnician">;

function isActiveTechnician(staff: StaffMember): boolean {
    if (staff.status !== "active") return false;
    if (!staff.isRepairTechnician) return false;
    if (staff.isDeleted || staff.deleteStatus === "soft_deleted") return false;
    return true;
}

export async function listRepairTechnicians(): Promise<RepairTechnician[]> {
    const staff = await listStaffMembers({ keyword: "" });
    return staff
        .filter((row) => isActiveTechnician(row))
        .map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            status: row.status,
            isRepairTechnician: row.isRepairTechnician,
        }));
}

export async function searchRepairTechnicians(keyword: string): Promise<RepairTechnician[]> {
    const query = keyword.trim();
    if (!query) return listRepairTechnicians();

    const staff = await listStaffMembers({ keyword: query });
    return staff
        .filter((row) => isActiveTechnician(row))
        .map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            status: row.status,
            isRepairTechnician: row.isRepairTechnician,
        }));
}
