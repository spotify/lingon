# Contributing

We love pull requests. Here's a quick guide.

### 1. Fork, then clone the repo:

    git clone git@github.com:jpettersson/lingon.git

### 2. Install dependencies:

    npm install

### 3. Make sure the tests pass:

You want to be sure that everything is A-OK before starting work on your feature.

    ./test.sh


### 4. Write Documentation

The Lingon contributors practise README driven development. Add your changes to the documentation before writing code. This will put you in a happy place where you contemplate about how real users will interact with your change. 

If your change affects the stable Lingon API, update ``docs/API.md``<br />
If your change affects how a user interacts with Lingon, update ``docs/USAGE.md``

### 5. Write your feature

Ok, so now you can write some code. Have fun!

### 6. Add tests for your feature. Make the tests pass:

    ./test.sh

### 7. Briefly describe your change in the CHANGELOG.md file under HEAD

This makes sure we announce the change in the next release.

### 8. Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/jpettersson/lingon/compare/

TravisCI will run the test suite and let you know that you've done and awesome job. If travis says A-OK, your work is done for now. At this point you're waiting on us. We like to at least comment on pull requests
within two business days (and, typically, one business day). We may suggest
some changes or improvements or alternatives. We promise to respond to all PRs.

# Releasing

The following is a guide describing the Lingon release process. The text is targeted towards Lingon contributors with merge/publish privileges.

## Releasing a patch

A patch is a change that addresses some flaw or issue in either the Lingon source code or the documentation. 

* A patch MUST not add new functionality. 
* A patch SHOULD be tested.

### 1. Find a bug

You have found a bug (from usage or a bug issue). 

* If an issue exist, self assign to signal that you are working on this.
* If no issue exists you should create one.

### 2. Write the test, then fix the bug

First, reproduce the bug locally and create a system or unit test that can catch it. Then proceed with writing a fix.

### 3. Update HEAD in changelog

Add an entry to the changelog HEAD section so explain what you have fixed.

### 4. Push to master & wait for Travis OK

Push your change to master and wait for Travis to confirm that everything is OK.

### 5. Create a review release tag & test manually

* Update the version in package json to signal a review release. Use the format: `2.0.0-review1`.
* Create a tag with the same name: `2.0.0-review1` and push it.
* Manually test the review release in your favorite Lingon project.
* Invite others to test if you are extra paranoid.

This step can be skipped if you have a high confidence in that the patch will NOT break anything else.

### 6. Publish to NPM

* Increment the version to the next patch: For instance, `2.0.1`.
* Publish to NPM

## Releasing a feature (minor release)

### 1. Select a feature

Self assign one of the the `planned-feature` issues (create one if it does not exist).

### 2. Write feature & tests

Work on a branch and write a feature.

* Include good test covereage of the new feature
* Include relevant documentation for the feature
* Include a CHANGELOG entry for the feature

### 3. Send a PR

When the feature is done, or you want feedback, create a PR.

### 4. Wait for at least 1 other person to approve

Discuss the feature with at least 1 other Lingon maintainer before mergin. Common practise is that you never merge your own feature. Instead, ask someone else to review and merge for you.

### 5. Sync with team

Sync the release of features with the other Lingon maintainers. Ideally we should batch some changes up and not release every single feature as it's own minor.

## Releasing a breaking change (major release)

Let's not do that! No, but seriously.. we try to avoid this as much as possible. Because of this, it's not a process to be defined in a document. We'll have a conversation about it.
