# Qualia lasr

Like [lunr](https://lunrjs.com/), but more focused. Provides search across
arrays of objects.

Available on [Atmosphere](https://atmospherejs.com/qualia/lasr).

## Usage

```js
import lasr from 'meteor/qualia:lasr';

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

const results = lasr.search({
  items: people,
  query: 'Magic',
  keys: [
    'name',
    'skills.name',
    'skills.level',
  ],
  limit: 10,
});
```

```js
results = [
  {
    "item": {
      "_id": "wizard",
      "name": "The Wizard",
      "skills": [
        {
          "name": "Magic",
          "level": 41
        }
      ]
    },
    "score": 1,
    "matches": [
      {
        "key": "skills.name",
        "value": "Magic",
        "indices": [
          [
            0,
            4
          ]
        ],
        "score": 1
      }
    ]
  },
  {
    "item": {
      "_id": "mage",
      "name": "The Mage",
      "skills": [
        {
          "name": "Magicking",
          "level": 42
        }
      ]
    },
    "score": 0.5555555555555556,
    "matches": [
      {
        "key": "skills.name",
        "value": "Magicking",
        "indices": [
          [
            0,
            4
          ]
        ],
        "score": 0.5555555555555556
      }
    ]
  }
]
```

## Testing this package

This package has
[TinyTests](https://github.com/meteor/meteor/tree/master/packages/tinytest). To
run the tests, first isolate this package from the Meteor app by copying it to
its own directory. For example, to put it in your home directory:

    rsync -r path/to/qualia_lasr ~/

Then run the tests from within the copied package directory:

    cd ~/qualia_lasr
    meteor test-packages ./
