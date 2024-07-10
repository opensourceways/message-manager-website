import type { Subscribe } from "@/@types/type-config";

export const subsSettingsRowNamesGenerator: any = {
  'https://eur.openeuler.openatom.cn': {
    build: () => 'EUR消息'
  },
  'https://gitee.com': {
    default: () => 'Gitee消息',
    issue: () => 'Issue消息',
    pr: () => 'Pull Request消息',
    push: () => 'Push消息',
    note: () => '评论消息',
  }
}

export const subscribeSettingsInitialData = [
  { source: 'https://eur.openeuler.openatom.cn', event_type: 'build' },
  {
    source: 'https://gitee.com',
    children: [
      { source: 'https://gitee.com', event_type: 'issue' },
      { source: 'https://gitee.com', event_type: 'pr' },
      { source: 'https://gitee.com', event_type: 'push' },
      { source: 'https://gitee.com', event_type: 'note' },
    ],
  },
];
