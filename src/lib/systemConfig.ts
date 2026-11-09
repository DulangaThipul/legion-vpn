// ========================================================================
// LEGION VPN - GLOBAL SYSTEM CONFIGURATION HELPER (ZERO-MIGRATION)
// Stores global admin configurations in Admin user's subscriptionLink JSON
// ========================================================================

import { prisma } from "@/lib/prisma";
import { DEFAULT_ISP_DOMAINS, DEFAULT_PACKAGE_SNIS } from "./vlessGenerator";

export interface GlobalSystemConfig {
  ispDomains: Record<string, string>;
  packageSnis: Record<string, string>;
  primary3xui: {
    baseUrl: string;
    username: string;
    password: string;
    inboundId: number | string;
    port: number | string;
    subBaseUrl: string;
  };
  bonusUsa3xui: {
    enabled: boolean;
    baseUrl: string;
    username: string;
    password: string;
    inboundId: number | string;
  };
  autoApprovalEnabled: boolean;
  expectedBankAccount: string;
  allowedTimeWindowMinutes: number;
  verifiedRefLedger: Array<{
    refNumber: string;
    email: string;
    packageName: string;
    amount: number;
    date: string;
    verifiedAt: string;
  }>;
}

export const DEFAULT_SYSTEM_CONFIG: GlobalSystemConfig = {
  ispDomains: { ...DEFAULT_ISP_DOMAINS },
  packageSnis: { ...DEFAULT_PACKAGE_SNIS },
  primary3xui: {
    baseUrl: "https://103.179.44.75:2096",
    username: "",
    password: "",
    inboundId: 1,
    port: 443,
    subBaseUrl: "https://103.179.44.75:2096/sub/"
  },
  bonusUsa3xui: {
    enabled: false,
    baseUrl: "",
    username: "",
    password: "",
    inboundId: 1
  },
  autoApprovalEnabled: true,
  expectedBankAccount: "8029138148",
  allowedTimeWindowMinutes: 120,
  verifiedRefLedger: []
};

const ADMIN_EMAIL = "dulangathipul@gmail.com";

/**
 * Loads the Global System Configuration from Admin user's subscriptionLink JSON
 */
export async function getGlobalSystemConfig(): Promise<GlobalSystemConfig> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL }
    });

    if (!adminUser || !adminUser.subscriptionLink) {
      return { ...DEFAULT_SYSTEM_CONFIG };
    }

    let parsedMeta: any = {};
    try {
      parsedMeta = JSON.parse(adminUser.subscriptionLink);
    } catch {
      return { ...DEFAULT_SYSTEM_CONFIG };
    }

    const saved = parsedMeta._globalSystemConfig || {};

    return {
      ispDomains: { ...DEFAULT_SYSTEM_CONFIG.ispDomains, ...(saved.ispDomains || {}) },
      packageSnis: { ...DEFAULT_PACKAGE_SNIS, ...(saved.packageSnis || {}) },
      primary3xui: { ...DEFAULT_SYSTEM_CONFIG.primary3xui, ...(saved.primary3xui || {}) },
      bonusUsa3xui: { ...DEFAULT_SYSTEM_CONFIG.bonusUsa3xui, ...(saved.bonusUsa3xui || {}) },
      autoApprovalEnabled: saved.autoApprovalEnabled !== undefined ? Boolean(saved.autoApprovalEnabled) : true,
      expectedBankAccount: saved.expectedBankAccount || DEFAULT_SYSTEM_CONFIG.expectedBankAccount,
      allowedTimeWindowMinutes: Number(saved.allowedTimeWindowMinutes) || DEFAULT_SYSTEM_CONFIG.allowedTimeWindowMinutes,
      verifiedRefLedger: Array.isArray(saved.verifiedRefLedger) ? saved.verifiedRefLedger : []
    };
  } catch (error) {
    console.error("Error reading GlobalSystemConfig:", error);
    return { ...DEFAULT_SYSTEM_CONFIG };
  }
}

/**
 * Updates Global System Configuration in Admin user's subscriptionLink JSON
 */
export async function updateGlobalSystemConfig(updates: Partial<GlobalSystemConfig>): Promise<{ success: boolean; config?: GlobalSystemConfig; error?: string }> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL }
    });

    if (!adminUser) {
      return { success: false, error: "Admin user not found" };
    }

    let parsedMeta: any = {};
    if (adminUser.subscriptionLink) {
      try {
        parsedMeta = JSON.parse(adminUser.subscriptionLink);
      } catch {
        parsedMeta = {};
      }
    }

    const currentGlobal = parsedMeta._globalSystemConfig || {};
    const mergedGlobal: GlobalSystemConfig = {
      ispDomains: { ...DEFAULT_SYSTEM_CONFIG.ispDomains, ...(currentGlobal.ispDomains || {}), ...(updates.ispDomains || {}) },
      packageSnis: { ...DEFAULT_PACKAGE_SNIS, ...(currentGlobal.packageSnis || {}), ...(updates.packageSnis || {}) },
      primary3xui: { ...DEFAULT_SYSTEM_CONFIG.primary3xui, ...(currentGlobal.primary3xui || {}), ...(updates.primary3xui || {}) },
      bonusUsa3xui: { ...DEFAULT_SYSTEM_CONFIG.bonusUsa3xui, ...(currentGlobal.bonusUsa3xui || {}), ...(updates.bonusUsa3xui || {}) },
      autoApprovalEnabled: updates.autoApprovalEnabled !== undefined ? Boolean(updates.autoApprovalEnabled) : (currentGlobal.autoApprovalEnabled ?? true),
      expectedBankAccount: updates.expectedBankAccount || currentGlobal.expectedBankAccount || DEFAULT_SYSTEM_CONFIG.expectedBankAccount,
      allowedTimeWindowMinutes: Number(updates.allowedTimeWindowMinutes) || currentGlobal.allowedTimeWindowMinutes || DEFAULT_SYSTEM_CONFIG.allowedTimeWindowMinutes,
      verifiedRefLedger: updates.verifiedRefLedger || currentGlobal.verifiedRefLedger || []
    };

    parsedMeta._globalSystemConfig = mergedGlobal;

    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        subscriptionLink: JSON.stringify(parsedMeta)
      }
    });

    return { success: true, config: mergedGlobal };
  } catch (error: any) {
    console.error("Error updating GlobalSystemConfig:", error);
    return { success: false, error: error?.message || "Failed to update global config" };
  }
}
