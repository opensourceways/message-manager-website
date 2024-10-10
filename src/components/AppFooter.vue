<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLocale } from '@/composables/useLocale';
import { checkOriginLink, windowOpen } from '@/utils/common';
import {
  OSCHINA,
  CSDN_BLOG,
  JUEJIN,
  BILIBILI_SPACE,
  INFOQ,
  CTO51,
  REDDIT,
  LINKEDIN,
  TWITTER,
  YOUTUBE,
  OPENEULER,
  OPENATOM,
  OPENEULER_CONTACT,
} from '@/data/config';

import ContentWrapper from '@/components/ContentWrapper.vue';
import ExternalLink from '@/components/ExternalLink.vue';

import LogoFooter from '@/assets/footer/footer-logo2.png';
import LogoFooter1 from '@/assets/footer-logo1.png';
import LogoAtom from '@/assets/footer/atom-logo.svg';
import FooterBg from '@/assets/footer/footer-bg.png';
import FooterBgMo from '@/assets/footer/footer-bg-mo.png';

// 中文友情链接
import LogoBilibili from '@/assets/footer/bilibili.png';
import LogoInfoq from '@/assets/footer/infoq.png';
import LogoJuejin from '@/assets/footer/juejin.png';
import LogoOschina from '@/assets/footer/oschina.png';
import LogoCsdn from '@/assets/footer/csdn.png';
import Logo51cto from '@/assets/footer/51cto.png';

// 英文、俄文友情链接
import LogoRedditSquare from '@/assets/footer/reddit-square@2x.png';
import LogoBilibili2 from '@/assets/footer/bilibili@2x.png';
import LogoLinkedin from '@/assets/footer/linkedin@2x.png';
import LogoYoutube from '@/assets/footer/youtube@2x.png';
import LogoTwitter from '@/assets/footer/twitter@2x.png';

// 公众号、小助手
import CodeTitleXzs from '@/assets/footer/img-xzs.png';
import CodeTitleGzh from '@/assets/footer/img-gzh.png';
import CodeImgXzs from '@/assets/footer/code-xzs.png';
import CodeImgZgz from '@/assets/footer/code-zgz.png';

const router = useRouter();
const { t, isZh } = useLocale();

// 友情链接
const linksData: any = {
  zh: [
    {
      href: OSCHINA + '/openeuler',
      logo: LogoOschina,
      id: 'oschina',
    },
    {
      href: CSDN_BLOG + '/openEuler_?spm=1000.2115.3001.5343',
      logo: LogoCsdn,
      id: 'csdn',
    },
    {
      href: JUEJIN + '/user/3183782863845454',
      logo: LogoJuejin,
      id: 'juejin',
    },
    {
      href: BILIBILI_SPACE + '/527064077/channel/series',
      logo: LogoBilibili,
      id: 'bilibili',
    },
    {
      href: INFOQ + '/profile/6E6CE3E2316F28/publish',
      logo: LogoInfoq,
      id: 'infoq',
    },
    {
      href: CTO51 + '/u_14948868',
      logo: Logo51cto,
      id: '51cto',
    },
  ],
  en: [
    {
      href: REDDIT + '/r/openEuler/',
      logo: LogoRedditSquare,
      id: 'reddit-square',
    },
    {
      href: LINKEDIN + '/company/openeuler',
      logo: LogoLinkedin,
      id: 'linkedin',
    },
    {
      href: TWITTER + '/openEuler',
      logo: LogoTwitter,
      id: 'twitter',
    },
    {
      href: BILIBILI_SPACE + '/527064077/channel/series',
      logo: LogoBilibili2,
      id: 'bilibili',
    },
    {
      href: YOUTUBE + '/channel/UCPzSqXqCgmJmdIicbY7GAeA',
      logo: LogoYoutube,
      id: 'youtube',
    },
  ],
};
// 隐私链接
const linksData2 = {
  zh: [
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
  ],
  en: [
    {
      NAME: 'Trademark',
      URL: OPENEULER + '/en/other/brand/',
    },
    {
      NAME: 'Legal Notice',
      URL: OPENEULER + '/en/other/legal/',
    },
  ],
};

const linkList = computed(() => (isZh.value ? linksData.zh : linksData.en));

const footLink = computed(() => (isZh.value ? linksData2.zh : linksData2.en));

// 公众号、小助手
const footerCodeList = [
  {
    img: CodeTitleXzs,
    code: CodeImgXzs,
    label: t('common.FOOTER.QR_CODE'),
  },
  {
    img: CodeTitleGzh,
    code: CodeImgZgz,
    label: t('common.FOOTER.QR_ASSISTANT'),
  },
];

const handleNavClick = (path: string) => {
  if (path.startsWith('https:')) {
    windowOpen(path, '_blank');
  } else {
    router.push(`/${'zh'}` + path);
  }
};

// 背景
const footBg = {
  pc: `url(${FooterBg})`,
  mo: `url(${FooterBgMo})`,
};

const showExternalDlg = ref(false);
const externalLink = ref('');
const onExternalDialog = (href: string) => {
  externalLink.value = href;
  if (checkOriginLink(href)) {
    windowOpen(href, '_blank');
  } else {
    showExternalDlg.value = true;
  }
};
</script>

<template>
  <div class="footer">
    <div class="atom">
      <p class="atom-text">{{ t('common.FOOTER.ATOM_TEXT') }}</p>
      <a :href="OPENATOM" target="_blank" rel="noopener noreferrer">
        <img :src="LogoAtom" class="atom-logo" alt="" />
      </a>
    </div>
    <div class="footer-content">
      <ContentWrapper>
        <div class="inner">
          <div class="footer-logo">
            <img class="show-pc" :src="LogoFooter" alt="" />
            <img class="show-mo" :src="LogoFooter1" alt="" />
            <p>
              <a class="email" :href="`mailto:${OPENEULER_CONTACT}`" target="_blank" rel="noopener noreferrer"> {{ OPENEULER_CONTACT }} </a>
            </p>
          </div>
          <div class="footer-option">
            <div class="footer-option-item">
              <span v-for="link in footLink" :key="link.URL" class="link" @click="handleNavClick(link.URL)">{{ link.NAME }}</span>
            </div>
            <p class="copyright">{{ t('common.FOOTER.COPY_RIGHT') }}</p>
            <p class="license">
              <span>{{ t('common.FOOTER.LICENSED_1') }}</span>
              {{ t('common.FOOTER.LICENSED_2') }}
            </p>
          </div>
          <div class="footer-right">
            <div v-if="isZh" class="code-box">
              <span v-for="(item, index) in footerCodeList" :key="index" class="code-pop">
                <img :src="item.img" class="code-img" alt="" />
                <div class="code-layer">
                  <img :src="item.code" alt="" />
                  <p class="txt">{{ item.label }}</p>
                </div>
              </span>
            </div>
            <div class="footer-links" :class="isZh ? 'zh' : ''">
              <span v-for="item in linkList" :key="item.id" @click="onExternalDialog(item.href)" class="links-logo">
                <img :src="item.logo" alt="" />
              </span>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
    <!-- 跳转外部链接提示 -->
    <ExternalLink v-if="showExternalDlg" :href="externalLink" @change="showExternalDlg = false" />
  </div>
</template>

<style lang="scss" scoped>
$color: #fff;
.footer {
  background: #1e1e1e;
  &.migration {
    margin-left: 300px;
    @media (max-width: 1100px) {
      margin-left: 0;
    }
  }
  :deep(.app-content) {
    padding-bottom: 0;
  }
  .cookie-privacy {
    width: 100%;
    height: 48px;
    background-color: var(--o-color-bg1);
    color: var(--o-color-text3);
    @include tip1;
    line-height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 999;
    box-shadow: var(--o-shadow-1);
    text-align: center;
    @media screen and (max-width: 1000px) {
      display: inline-block;
    }
    a {
      cursor: pointer;
      text-decoration: solid;
      white-space: pre;
    }
    .icon {
      cursor: pointer;
      vertical-align: middle;
      margin-left: 16px;
      width: 24px;
      height: 24px;
      background: var(--o-color-greyblack3);
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      svg {
        font-size: 20px;
        color: var(--el-color-white);
      }
      @media screen and (max-width: 1000px) {
        width: 20px;
        height: 20px;
        margin-left: 12px;
      }
    }
  }
  .atom {
    text-align: center;
    padding: 32px 0 24px;
    position: relative;
    border-bottom: 1px solid rgba(229, 229, 229, 0.12);
    @media (max-width: 1440px) {
      padding: 24px 0;
    }

    &-text {
      @include h4;
      font-weight: 400;
      color: $color;
    }
    &-logo {
      height: 48px;
      margin-top: 16px;
      @media (max-width: 1100px) {
        height: 30px;
      }
    }
  }

  &-content {
    background: v-bind('footBg.pc') no-repeat bottom center;
    @media (max-width: 767px) {
      background: v-bind('footBg.mo') no-repeat bottom center;
    }
    .inner {
      display: flex;
      align-items: end;
      justify-content: space-between;
      padding: 18px 0 32px;
      position: relative;
      min-height: 118px;
      @media (max-width: 1436px) {
        padding: 24px 0;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
  &-logo {
    flex: 1;
    img {
      height: 46px;
    }
    .show-pc {
      display: block;
    }
    .show-mo {
      display: none;
    }
    @media (max-width: 1436px) {
      text-align: center;
      margin: 16px 0;
      .show-pc {
        display: none;
      }
      .show-mo {
        display: inline-block;
        height: 20px;
      }
    }
  }

  .copyright {
    @include tip1;
    color: $color;
    margin-top: 16px;
    @media (max-width: 1436px) {
      margin-top: 8px;
    }
  }
  .license {
    @include tip1;
    color: $color;
    margin-top: 16px;
    span {
      color: #777;
    }
    @media (max-width: 1400px) {
      margin-top: 8px;
    }
  }

  .footer-option {
    text-align: center;
    .link {
      color: $color;
      font-size: var(--o-font_size-tip1);
      display: inline-block;
      padding: 0 12px;
      border-right: 1px solid $color;
      cursor: pointer;
      &:last-child {
        border-right: 0;
      }
      @media (max-width: 1436px) {
        padding: 0 6px;
        font-size: var(--o-font_size-tip2);
      }
    }
    @media (max-width: 1436px) {
      order: -1;
    }
  }

  .footer-right {
    flex: 1;
    .code-box {
      display: flex;
      justify-content: right;
      margin-bottom: 16px;
      .code-pop + .code-pop {
        margin-left: 16px;
      }
      .code-pop {
        position: relative;
        height: 20px;
        display: block;
        > img {
          height: 100%;
          object-fit: cover;
        }
        .code-layer {
          position: absolute;
          top: -105px;
          left: -32px;
          z-index: 99;
          display: none;
          background: #fff;
          padding: 6px;
          img {
            width: 78px;
            height: 78px;
          }
          .txt {
            font-size: 12px;
            color: $color;
            display: none;
          }
          &::after {
            border: 10px solid transparent;
            content: '';
            border-top-color: #fff;
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            display: block;
          }
          @media (max-width: 800px) {
            display: block;
            position: initial;
            background: none;
            padding: 0;
            text-align: center;
            &::after {
              display: none !important;
            }
            .txt {
              display: block;
            }
          }
        }
        &:hover {
          .code-layer {
            display: block;
          }
        }
        @media (max-width: 800px) {
          height: auto;
          > img {
            display: none;
          }
        }
      }
      @media (max-width: 1436px) {
        justify-content: center;
      }
      @media (max-width: 1100px) {
        margin-top: 24px;
      }
    }
    .footer-links {
      display: flex;
      justify-content: right;
      align-items: center;

      .links-logo + .links-logo {
        margin-left: 16px;
      }
      .links-logo {
        height: 16px;
        cursor: pointer;
        img {
          height: 100%;
          object-fit: cover;
        }
      }
      @media (max-width: 1100px) {
        justify-content: center;
      }
      @media (max-width: 800px) {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        text-align: center;
        margin-top: 40px;
        gap: 10px;
        .img {
          height: 16px;
        }
      }
      &.iszh {
        .links-logo + .links-logo {
          margin-left: 10px;
        }
        .links-logo {
          height: 14px;

          &:first-child {
            height: 18px;
          }
        }
        @media (max-width: 800px) {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          text-align: center;
          margin-top: 40px;
          .img {
            height: 16px;
          }
        }
      }
    }

    p {
      color: $color;
      @include tip1;
      margin-top: 8px;
    }
  }

  .email {
    color: $color;
    @include tip1;
  }
}
</style>
