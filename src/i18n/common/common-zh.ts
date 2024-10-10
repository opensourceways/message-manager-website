import { OPENEULER, OPENEULER_STATUS, OPENEULER_CONTACT } from '@/data/config';

export default {
  FOOTER: {
    ATOM_TEXT: 'openEuler 是由开放原子开源基金会（OpenAtom Foundation）孵化及运营的开源项目',
    ATOM_PC: '/atom-pc.png',
    ATOM_MO: '/atom-mo.png',
    MAIL: OPENEULER_CONTACT,
    COPY_RIGHT: '版权所有 © 2024 openEuler 保留一切权利',
    LICENSED_1: '遵循',
    LICENSED_2: '木兰宽松许可证第2版（MulanPSL2）',
    RIGHT_LIST: [
      {
        NAME: '品牌',
        URL: OPENEULER + '/zh/other/brand/',
      },
      {
        NAME: '隐私政策',
        URL: OPENEULER + '/zh/other/privacy/',
      },
      {
        NAME: '法律声明',
        URL: OPENEULER + '/zh/other/legal/',
      },
      {
        NAME: '服务状态',
        URL: OPENEULER_STATUS,
      },
    ],
    LINKS: [],
    QR_CODE: 'openEuler公众号',
    QR_ASSISTANT: 'openEuler小助手',
  },
}