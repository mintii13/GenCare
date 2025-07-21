module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    ['babel-plugin-transform-import-meta', {
      replace: {
        env: {
          VITE_API_URL: 'http://localhost:3000',
        }
      }
    }]
  ],
};
