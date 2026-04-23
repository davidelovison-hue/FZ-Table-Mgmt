# Ignite Design Tokens

Design system token repository. Managed in Figma to use in combination with Style Dictionary.

## What are design tokens?

Design tokens are names used to express design decisions in our Ignite's design language. Those names are meant to be used and understood by humans like you and us. Design decisions can be a color, a typeface, a border-radius, a font size, a gradient, or even an animation duration — represented as data.

For further information about What design tokens are, token types, naming conventions, how to use them, and resources, check Ignite's documentation [here](https://fever.designsystem.feverup.com/1d4a57dde/p/00337b-design-tokens/b/8340a3).

## Usage

### Installation

To install the project dependencies, run the following command:
`npm ci`


### Generate Design Tokens

To generate the design tokens, run the following command:

`npm run build:tokens`


### Generate Style Files

To generate the style files for each platform, use the following commands:

- Android: `npm run build:android`
- iOS: `npm run build:ios`
- Web: `npm run build:web`

Make sure to install the necessary dependencies before running the commands


