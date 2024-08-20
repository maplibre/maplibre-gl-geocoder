## Developing

Install Node.js ^20

    nvm install 20

    npm install & npm start & open http://localhost:9966/

## Testing

Lastly, run the test command from the console:

    npm test

## Deploying

Follow this deploy process after all changes for the release are merged into main. You will copy and paste this checklist in the comment of the release pull request.


## Release checklist

Using github actions, create a bump version PR, update the changelog in that PR.
Merge it to main and the rest will be done using Github actions.
