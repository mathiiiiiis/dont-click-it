# Don't Click It

A reflex game. A narrator tells you whether to click or not click a big red button (you like that, right?). Sometimes the narrator lies (or are they?).

Inspired by The Stanley Parable. The narrator is the game. The mechanics just give them something to talk about.

## Running

```
npm install
npm run dev
```

Open http://localhost:5173.

Build for production:

```
npm run build
```

## Adding rounds

Open `src/content/rounds.ts` and add a new `Round`:

```
{
  id: 'new-round-id',
  intro: 'Something the narrator says.',
  duration: 2800,
  shouldClick: true,
  good: ['Lines for a correct outcome.'],
  bad: ['Lines for a wrong outcome.'],
}
```

## Sounds

- appear, click, correct, wrong were created in: https://onlinesequencer.net/
- drone was created in: https://signalmidi.app/

Thanks to the owners of these platforms for creating these tools!
