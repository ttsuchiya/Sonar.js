# Fetch

## Factory Method
```javascript
snr.fetch('path/to/file.mp3').then(data => {});
```

If used in an async-enabled scope. 
```javascript
(async () => {
  const data = await snr.fetch('path/to/data.csv');
  data.print();
})();
```

## Static Methods
### any
### audio
### CSV