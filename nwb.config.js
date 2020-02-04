module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'GroveReactMapComponents',
      externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
      }
    }
  },
  webpack: {
    html: {
      template: 'demo/src/index.html'
    }
  },
  karma: {
    testContext: 'tests/setupTests.js'
  }
};
