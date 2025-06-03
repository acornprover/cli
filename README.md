# cli

The command-line interface to Acorn.

## Usage

To install:

```
npm i -g @acornprover/cli
```

To use this CLI, you should have a copy of [acornlib](https://github.com/acornprover/acornlib) on your local machine, in a directory named "acornlib".

To verify the entire project, from the `acornlib` directory:

```
acorn
```

To verify a single file:

```
acorn filename.ac
```

The CLI will generally keep itself updated.

## Contributions

This repo is just a wrapper for distribution via npm. See [the main Acorn repo](https://github.com/acornprover/acorn) for the code that runs the actual language, verifier, and language server.
