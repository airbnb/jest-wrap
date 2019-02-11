1.5.0 / 2019-02-11
==================
  * [New] adds support for Jest ^24

1.4.0 / 2018-06-08
==================
  * [New] adds support for Jest ^23

1.3.1 / 2018-05-01
=================
  * [Fix] ensure that skip works inside plugins, and plugins with no changes but the mode work
  * [Deps] update `semver`
  * [Dev Deps] update `eslint`, `istanbul-lib-coverage`, `nsp`, `tape`, `eslint-plugin-import`

1.3.0 / 2018-01-04
=================
  * [New] adds support for Jest ^22
  * [Deps] update `function.prototype.name`, `is-primitive`, `object-inspect`
  * [Dev Deps] update `eslint`, `eslint-config-airbnb-base`, `eslint-plugin-import`, `nsp`, `rimraf`
  * Move repo to airbnb

1.2.0 / 2017-05-12
=================
  * [New] add `jest` `v21` support
  * [Deps] update `function-bind`, `function.prototype.name`, `object-inspect`, `semver`
  * [Dev Deps] update `eslint`, `@ljharb/eslint-config`, `istanbul-lib-coverage`, `nsp`, `tape`
  * [Tests] make a matrix of jests
  * [Tests] only test major node versions; include `v8`
  * [Tests] use `nvm install-latest-npm` to ensure newer npms don’t break on older nodes

1.1.0 / 2017-05-12
=================
  * [New] Add jest 20 support (#9)
  * [Docs] Correct links/badges in the README (#8)
  * [Tests] on `node` `v7.10`
  * [Tests] Correct jest18/19 in package.json (#5)

1.0.2 / 2017-04-11
=================
  * [Fix] Fix descriptions when using multiple wrappers (#4)
  * [Fix] Stop reversing the afterEach hooks (#4)
  * [Fix] Update global beforeAll/afterAll hooks (#4)
  * [Fix] Remove .specify() (#4)
  * [Deps] update `object-inspect`
  * [Dev Deps] update `eslint`, `istanbul-lib-coverage`
  * [Tests] up to `node` `v7.9`
  * [Tests] Update core.js tests to work around bug in jest (#4)

1.0.1 / 2017-03-16
=================
  * [Fix] avoid exponentially adding outer wrappers (#3)
  * [Deps] lock `isarray` down to v1 only (v2 has a silly deprecation warning)
  * [Dev Deps] update `eslint`, `nsp`, `jest`, `rimraf`
  * [Tests] up to `node` `v7.7`, `v6.10`, `v4.8`

1.0.0 / 2017-02-18
=================
  * Initial release.
