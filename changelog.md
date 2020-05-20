# <sub>v0.5.0</sub>
#### _May. 20, 2020_
  * Return `reqHeaders` object in the response for both http1 and http2 adapters.

# <sub>v0.4.0</sub>
#### _Jan. 5, 2020_
  * Add support for HTTP/2.
  * Drop support for node v8.
  * Update packages to the latest versions.
  * Refactor codebase, rewrite tests.

# <sub>v0.3.2</sub>
#### _Nov. 2, 2019_
  * Remember response redirects history.
  * Remove `content-*` headers on redirect.

# <sub>v0.3.1</sub>
#### _Nov. 2, 2019_
  * Rename response `status` to `statusCode`.

# <sub>v0.3.0</sub>
#### _Nov. 2, 2019_
  * Add support for redirects following.
  * Don't throw error when `responseType` is `json` and `response.data` can't be parsed.

# <sub>v0.2.2</sub>
#### _Sep. 17, 2019_
  * Add Type Definitions.

# <sub>v0.2.1</sub>
#### _Sep. 17, 2019_
  * Fix bug in extending nsend by method aliases.

# <sub>v0.2.0</sub>
#### _Sep. 17, 2019_
  * Add http-method aliases.

# <sub>v0.1.2</sub>
#### _Sep. 16, 2019_
  * Fix bug in transport determination.

# <sub>v0.1.1</sub>
#### _Sep. 16, 2019_
  * Replace `finally` to `then.catch` calls to support node v8.

# <sub>v0.1.0</sub>
#### _Sep. 15, 2019_
 * Release the first version.
