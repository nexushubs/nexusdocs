# Namespace

## Basic Information

In NexusDocs, namespace is the basic storage unit, just like 'bucket' in most cloud
storage service. It could be used for storing user files, cached converted files, and
archives.

User created namespace is very helpful for storing different type of files, such as
avatars or uploaded files.

A namespace is connected to a provider bucket for store the file data, and you can also
create multiple namespaces all connected to the same provider bucket.

### Properties

| Property | Description |
| -------- | ----------- |
| name | Should only contains lower-case letter & dot `.`, and unique in the server |
| provider | The provider associated |
| bucket | The bucket used of the provider |
| isPublic | If a namespace is public, everyone can visit without a signature token |
| description | A brief description of the namespace |

### Build-in Namespaces

Build-in namespaces are provided for quick start for user, and internal used for cache.

| Name | Description |
| ---- | ----------- |
| public | default namespace for storing public files by GridFS |
| private | default namespace for storing private files by GridFS |
| nexusdocs.cache | Internal cache for converted files and archive etc. |

These namespaces will be created after you run the install script:

```bash
ndstool install
```

*WARNING:* Please do not modify the internal namespace (normally with a name begins
with `nexusdocs`)!

## Command Line Reference

Basic namespace operations could be done by `ndstool`.

### Listing Namespaces

List all namespaces in the server:

```bash
ndstool namespace ls
```

### Creating Namespace

To create a new namespace, you must have a existing provider.

For example, you want to create a namespace named `avatar`, using the pre-installed
provider `default` and its bucket `public`:

```bash
ndstool namespace add avatar --provider default --bucket public --public --desc "User avatars"
```

### Updating Namespace

If we want the above namespace private, just type:

```bash
ndstool namespace update avatar --public false --desc "User avatars private"
```

The `update` command is just like the `add` command, except it ignores the properties
not provided.

### Removing Namespace

*WARNING:* You can only remove a empty namespace from the server.

If we no longer use namespace `avatar`, we could remove it:

```
ndstool namespace remove avatar
```
