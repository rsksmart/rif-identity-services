module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'cjs',
        targets: {
          esmodules: true,
          node: '8'
        }
      }
    ]
  ]
}
