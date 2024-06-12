module.exports = {
  prefix: '--o-',
  output: '../assets/style/theme',
  themeMap: [
    {
      key: 'light',
      name: 'light',
    },
    {
      key: 'dark',
      name: 'dark',
    },
  ],
  defaultTheme: 'light',
  tokenFile: ['./message-manager-token.json'],
  codeSnippetsFile: '../../.vscode/opendesign.token.code-snippet',
};
