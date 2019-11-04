module.exports = {
  type: "react-component",
  npm: {
    esModules: true,
    umd: false
  },
  webpack: {
    html: {
      template: "demo/src/index.html"
    }
  },
  karma: {
    testContext: 'tests/setupTests.js'
  }
};
