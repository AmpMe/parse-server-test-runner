# Parse Server Test Runner
This library allows [Parse Server](https://github.com/parse-community/parse-server) to be set up programmatically for testing purposes.

## Example
This is an example of a Jasmine spec using `parse-server-test-runner`.
The timeout is set to 2 minutes because downloading MongoDB might take a few minutes.

```javascript
const { startParseServer, stopParseServer, dropDB } = require('parse-server-test-runner');

// ...
describe('my spec', () => {
   beforeAll((done) => {
    const appId = 'test';
    const masterKey = 'test';
    const javascriptKey = 'test';

    startParseServer({ appId, masterKey, javascriptKey })
      .then(() => {
        Parse.initialize(appId, masterKey, javascriptKey);
        Parse.serverURL = 'http://localhost:30001/1';
      })
      .then(done).catch(done.fail);
  }, 100 * 60 * 2);

  afterAll((done) => {
    stopParseServer()
      .then(done).catch(done.fail);
  });

  beforeEach((done) => {
    dropDB()
      .then(done).catch(done.fail);
  });

  it('should work', (done) => {
    const q = new Parse.Query('_Installation')
    q.limit(5)
      .find({ useMasterKey: true })
      .then(console.log)
      .then(done).catch(done.fail);
  });
});
```

