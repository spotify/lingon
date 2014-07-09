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

### 7. Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/jpettersson/lingon/compare/

TravisCI will run the test suite and let you know that you've done and awesome job. If travis says A-OK, your work is done for now. At this point you're waiting on us. We like to at least comment on pull requests
within two business days (and, typically, one business day). We may suggest
some changes or improvements or alternatives. We promise to respond to all PRs.
