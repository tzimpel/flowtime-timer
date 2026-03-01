# flowtime-timer

A small browser-based timer for the flowtime method.

## Usage

Open `index.html` in a browser.

The timer has three states:

- `idle`: ready to start a work session
- `working`: counts up until you stop work
- `break`: counts down the suggested recovery time

The current session is persisted in `localStorage`, so refreshing the page resumes active work or break sessions when possible.

## Break rules

Break length is based on the completed work session:

- Up to 25 minutes of work: 5 minute break
- 26 to 50 minutes of work: 8 minute break
- 51 to 90 minutes of work: 10 minute break
- More than 90 minutes of work: 15 minute break
