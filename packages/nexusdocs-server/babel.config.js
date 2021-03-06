module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '8.11.3'
      }
    }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    ['module-resolver', {
      root: ['./src']
    }]
  ],
}
