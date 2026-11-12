# Bible text

`kjv-verses.json` contains all 66 books of the King James Version (KJV).

The source is [Arul John's Bible-KJV dataset](https://github.com/aruljohn/Bible-kjv),
which provides one JSON file per book. The dataset is distributed under the MIT
License; a copy is included in [LICENSE-Bible-kjv.txt](./LICENSE-Bible-kjv.txt).
The converter maps the original book, chapter, and verse references to the
app's numeric book IDs without changing the verse text.

To regenerate the bundled dataset, run:

```sh
node scripts/convert-kjv-json.mjs path/to/Bible-kjv
```

The KJV text is public domain in the United States. The Authorized Version has
special Crown rights in the United Kingdom, so verify local rights before
distributing the app there.
