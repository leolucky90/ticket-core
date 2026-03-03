export type HomeStats = {
    companies: number;
    tickets: number;
    automations: number;
};

export async function getHomeStats(): Promise<HomeStats> {
    // 先用 mock；未來換成 Firestore / API 只動這裡
    return {
        companies: 12,
        tickets: 3480,
        automations: 27,
    };
}