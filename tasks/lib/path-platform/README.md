
This is a copy of the original `path-platform` npm module.
We couldn't get it working, since it uses a non-existing `util.isString`.

path-platform taken from: https://github.com/tjfontaine/node-path-platform
"version": v0.11.15
commit: 901e4d8a69ed3906bbbec5f65e9b7eec6d033474

# path-platform

This is a transitional package for those not on 0.12 that provides a compatible
interface to the builtin `path` module, but adds `path.posix` and `path.win32`
so you can `path.posix.normalize` on a win32 platform, or vice versa.

