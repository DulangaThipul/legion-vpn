export async function updateUserAdmin(userId: string, data: any) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie?.value) throw new Error("Unauthorized");

    const payload = await verifyJwt(sessionCookie.value);
    
    // 💡 FIX: ආරක්ෂාවට මෙතනත් payload.id බලනවා
    if (!payload || !payload.id) throw new Error("Unauthorized");
    if (payload.email !== "dulangathipul@gmail.com") throw new Error("Unauthorized");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        vpnStatus: data.vpnStatus || "Active", 
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        vpnConfigKey: data.vpnConfigKey,
        subscriptionLink: data.subscriptionLink,
      },
    });
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}
