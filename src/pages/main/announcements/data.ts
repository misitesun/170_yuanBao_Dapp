/** Local UI fixtures only. These are not published announcements or an API contract. */
export type AnnouncementPreview = {
    id: string
    title: string
    publishedAt: string
    summary: string
    sections: readonly { heading: string; paragraphs: readonly string[] }[]
}

export const ANNOUNCEMENT_PREVIEWS: readonly AnnouncementPreview[] = [
    {
        id: 'welcome',
        title: '欢迎来到元宝（示例）',
        publishedAt: '2026-09-29T10:00:00+08:00',
        summary: '欢迎关注元宝公告，了解平台信息与最新动态。',
        sections: [
            { heading: '欢迎关注', paragraphs: ['欢迎来到元宝。您可以通过公告列表查看平台信息，并点击公告阅读完整内容。', '此条公告为静态展示示例，不代表平台正式发布的通知。'] },
            { heading: '阅读公告', paragraphs: ['公告详情展示标题、发布时间与正文。阅读完成后，可通过顶部返回入口回到公告列表。'] },
        ],
    },
    {
        id: 'notice-guide',
        title: '公告阅读说明（示例）',
        publishedAt: '2026-09-28T15:00:00+08:00',
        summary: '点击列表中的公告查看详情，重要信息请以正式发布的公告为准。',
        sections: [
            { heading: '查看完整内容', paragraphs: ['列表展示公告标题、摘要和发布时间，点击后可以查看完整正文。', '本条内容用于展示公告排版。涉及活动时间、参与条件等信息，请以平台后续正式公告为准。'] },
        ],
    },
    {
        id: 'updates',
        title: '平台动态展示（示例）',
        publishedAt: '2026-09-27T12:00:00+08:00',
        summary: '平台动态与相关通知将在公告中展示，欢迎持续关注。',
        sections: [
            { heading: '平台动态', paragraphs: ['您可以在这里阅读平台动态和相关通知。', '此内容仅用于静态页面展示，暂无正式更新安排。'] },
        ],
    },
]

export function formatAnnouncementTime(value: string) {
    return `${value.slice(0, 10).replaceAll('-', '.')} ${value.slice(11, 16)}`
}
