import assert from 'assert';

import lasr from './lasr';

const people = [
  {
    _id: 'fireman',
    name: 'The Fireman',
    skills: [
      {
        name: 'Firemaking',
        level: 9000,
      },
      {
        name: 'Watering',
        level: 9001,
      },
    ]
  },
  {
    _id: 'mage',
    name: 'The Mage',
    skills: [
      {
        name: 'Magicking',
        level: 42,
      },
    ]
  },
  {
    _id: 'wizard',
    name: 'The Wizard',
    skills: [
      {
        name: 'Magic',
        level: 41,
      },
    ]
  },
  {
    _id: 'developer',
    name: 'The Developer',
    skills: [
      {
        name: 'Typing',
        level: 9000,
      },
      {
        name: 'Sitting',
        level: 9001,
      },
    ]
  },
];

const searchKeys = [
  'name',
  'skills.name',
  'skills.level',
];

Tinytest.add('the search function is exported', test => {
  assert.strictEqual(typeof lasr.search, 'function');
});

Tinytest.add('search keys - handles arrays', test => {
  const results = lasr.search({
    items: people,
    query: 'Firemaking',
    keys: searchKeys,
    limit: 1,
  });
  const firstResult = results[0].item;
  assert.strictEqual(firstResult._id, 'fireman');
});

Tinytest.add('search keys - handles numbers', test => {
  const results = lasr.search({
    items: people,
    query: '42',
    keys: searchKeys,
    limit: 1,
  });
  const firstResult = results[0].item;
  assert.strictEqual(firstResult._id, 'mage');
});

Tinytest.add('search results - is case-insensitive', test => {
  const capitalResults = lasr.search({
    items: people,
    query: 'The Fireman',
    keys: searchKeys,
    limit: 1,
  });
  const lowercaseResults = lasr.search({
    items: people,
    query: 'the fireman',
    keys: searchKeys,
    limit: 1,
  });
  assert.strictEqual(capitalResults[0].item._id, 'fireman');
  assert.strictEqual(lowercaseResults[0].item._id, 'fireman');
});

Tinytest.add('search results - prioritizes exact matches', test => {
  const results = lasr.search({
    items: people,
    query: 'Magic',
    keys: searchKeys,
    limit: 10,
  });
  assert.strictEqual(results[0].item._id, 'wizard');
  assert.strictEqual(results[1].item._id, 'mage');
});

Tinytest.add('search results - tokenizes the query to disambiguate using other fields', test => {
  const ambiguousResults = lasr.search({
    items: people,
    query: '9000',
    keys: searchKeys,
    limit: 3,
  });
  assert.strictEqual(ambiguousResults.length, 2);
  assert.strictEqual(ambiguousResults[0].item._id, 'fireman');
  assert.strictEqual(ambiguousResults[1].item._id, 'developer');

  const unambiguousResults = lasr.search({
    items: people,
    query: '9000 sitting',
    keys: searchKeys,
    limit: 3,
  });
  assert.strictEqual(ambiguousResults.length, 2);
  assert.strictEqual(unambiguousResults[0].item._id, 'developer');
  assert.strictEqual(unambiguousResults[1].item._id, 'fireman');
});
