import { OPENEULER_STATUS, OPENEULER_CONTACT } from '@/data/config';

export default {
  FOOTER: {
    ATOM_TEXT: 'openEuler is an open source project incubated and operated by the OpenAtom Foundation.',
    ATOM_PC: '/atom-pc.png',
    ATOM_MO: '/atom-mo.png',
    MAIL: OPENEULER_CONTACT,
    COPY_RIGHT: 'Copyright © 2024 openEuler. All rights reserved.',
    LICENSED_1: 'Licensed under',
    LICENSED_2: 'the MulanPSL2',
    RIGHT_LIST: [
      {
        NAME: 'Trademark',
        URL: '/other/brand/',
      },
      {
        NAME: 'Privacy Policy',
        URL: '/other/privacy/',
      },
      {
        NAME: 'Legal Notice',
        URL: '/other/legal/',
      },
      {
        NAME: 'Service Status',
        URL: OPENEULER_STATUS,
      },
    ],
    QR_CODE: 'WeChat Subscription',
    QR_ASSISTANT: 'WeChat Assistant',
  },
}