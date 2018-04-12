/**
  Given a string value and a string query, try to find the query in the value.
  If found, return the indices of the start (inclusive) and end (exclusive) of
  the overlap, and the score for this match.
*/
function scoreStringMatch(value, queryToken) {
  const matchIndex = value.indexOf(queryToken);
  if (matchIndex < 0) {
    return null;
  }
  return {
    indices: [
      matchIndex,
      matchIndex + queryToken.length - 1,
    ],
    score: queryToken.length / value.length,
  };
}

/**
  Given a list of 2-element arrays representing [start, end] indices of
  regions, combine the overlapping regions.

  For example:

  coalesceRanges([[10, 11], [0, 5], [1, 5], [2, 6], [5, 6], [7, 8]])
  =>  [
        [0, 6],
        [7, 8],
        [10, 11],
      ]

  coalesceRanges([[10, 11]])
  =>  [
        [10, 11],
      ]
*/
function coalesceRanges(ranges) {
  if (!ranges || !ranges.length) {
    return ranges;
  }

  const copyRange = (range) => [range[0], range[1]];
  const newRanges = [];

  // Sort by start value
  ranges.sort((a, b) => a[0] - b[0]);

  let lastRange = copyRange(ranges[0]);
  for (let i = 1; i < ranges.length; i++) {
    const currentRange = ranges[i];
    if (currentRange[0] < lastRange[1]) {
      // Overlap: extend the range of lastRange
      lastRange[1] = Math.max(lastRange[1], currentRange[1]);
    } else {
      // No overlap: commit lastRange and start a new range
      newRanges.push(lastRange);
      lastRange = copyRange(currentRange);
    }
  }
  // Commit the range currently in progress
  newRanges.push(lastRange);
  return newRanges;
}

/**
  Given a string value and string query, score the value against the query
  and the tokenized version of the query. Return an object containing the
  match indices and the score, of the form
  {
    indices: [
      [start1, end1],
      [start2, end2],
      ...
    ],
    score: 0,
  }
  A higher score represents a better match.
*/
function scoreValue(value, query, queryTokens) {
  const match = {
    indices: [],
    score: 0,
  };

  // First try the whole query
  const queryMatch = scoreStringMatch(value, query);
  if (queryMatch) {
    match.score += queryMatch.score;
    match.indices.push(queryMatch.indices);
  } else {
    // If the whole query didn't match, try matching against tokens
    for (const queryToken of queryTokens) {
      const tokenMatch = scoreStringMatch(value, queryToken);
      if (tokenMatch) {
        match.score += tokenMatch.score;
        match.indices.push(tokenMatch.indices);
      }
    }
  }

  // Ensure the match indices represent disjoint highlighting regions
  match.indices = coalesceRanges(match.indices);

  return match;
}

/**
  Given an object and a path of dot-separated keys, find all of the values
  reachable by the path. The path should be the same style as a Fuse.js key
  or Mongo projection key, omitting array indices to find values in arrays.

  For example,

  const myObject = {
    a: [
      {b: 'baz'},
      {b: {
        c: 'foo'}
      },
      {c: 'bar'}
    ]
  }
  getValuesByPath(myObject, 'a.b')

  => ['baz', {c: 'foo'}]

  This function always returns an array. It omits values that are falsy
  (including 0, '', undefined, and null).
*/
function getValuesByPath(object, path) {
  const tokens = path.split('.');
  let currentObjects = [object];
  for (const token of tokens) {
    const currentValues = currentObjects.map(obj => obj[token]);
    currentObjects = _.compact(_.flatten(currentValues));
  }
  return currentObjects;
}

/**
  Given an object and an array of paths to extract from the object (each of
  which should be of the form required by getValuesByPath), return an array of
  {key, value, normalizedValue} objects representing the extracted values and
  their paths. If one path maps to multiple values (by traversing into an
  array), the output will include one entry for each of the values (and thus
  multiple entries with the same key).
*/
function getNormalizedKeyValueTuples(object, fieldNames) {
  const tuples = [];
  for (const fieldName of fieldNames) {
    const fieldValues = getValuesByPath(object, fieldName).map(value => String(value));
    for (const fieldValue of fieldValues) {
      const normalizedFieldValue = fieldValue.toLowerCase();
      tuples.push({
        key: fieldName,
        value: fieldValue,
        normalizedValue: normalizedFieldValue,
      });
    }
  }
  return tuples;
}

/**
  Given an object `item`, an array of searchable paths in the item, a string
  query, and an array of string query tokens, score the item against the query
  and tokens.
*/
function scoreItem(item, searchableFields, query, queryTokens) {
  let itemScore = 0;
  const matches = [];
  const queryLength = query.length;

  const keyValueTuples = getNormalizedKeyValueTuples(item, searchableFields);

  for (const {key, value, normalizedValue} of keyValueTuples) {
    const {indices, score} = scoreValue(normalizedValue, query, queryTokens);
    if (score) {
      matches.push({
        key,
        value,
        indices,
        score,
      });
      itemScore += score;
    }
  }

  // Put the best matches first
  matches.sort((a, b) => b.score - a.score);

  return {
    item,
    score: itemScore,
    matches,
  };
}

/**
  Search the array of objects `items` for the string `query`, considering fields
  on each object specified in `keys`, and returning the best `limit` results.

  Each key should be the same style as a Fuse.js key or Mongo projection key,
  omitting array indices to find values in arrays.

  Each result has the form

  {
    item,
    score,
    matches: [
      {
        key,
        value,
        indices: [[start1, end1], ...],
        score,
      },
      ...
    ]
  }

  This result format is identical to that of Fuse.js.

  The search is case-insensitive.
*/
function search({items, query, keys, limit=10}) {
  const normalizedQuery = query.toLowerCase();
  const queryTokens = _.compact(query.split(/\s/));
  const scoredResults = items.map(item => scoreItem(item, keys, normalizedQuery, queryTokens));
  const matches = scoredResults.filter(result => result.score > 0);
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

export {
  search
};
