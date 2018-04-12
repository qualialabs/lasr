Package.describe({
  name: 'qualia:lasr',
  version: '0.0.1',
  summary: 'Lasr search',
  git: 'https://github.com/qualialabs/lasr',
  documentation: 'README.md',
});

var dependencies = [
  'ecmascript',
  'underscore',
];

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4');
  api.use(dependencies, ['client', 'server']);
  api.mainModule('common/lasr.js');
});

Package.onTest(function(api) {
  api.versionsFrom('METEOR@1.4');

  api.use(dependencies);
  api.use([
    'tinytest',
    'practicalmeteor:sinon',
    'qualia:lasr',
  ]);

  api.mainModule('common/test.js');
});
