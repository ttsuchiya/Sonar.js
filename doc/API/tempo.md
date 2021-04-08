# Tempo
```javascript

```

## Factory Method

## Instance Methods
### init
### reset
### clear
### increment
### setIndex
### samplerate
### block
### hop

### deframe
Compensates for the amplitude modulation introduced by overlapped tapered windows (frames). Be careful that the windowing function should not have zeros (e.g., the triangular window may contain zeros), otherwise there will be a divide-by-zero error.


## Properties
### samplerate
### block
### hop
### duration
### output
### phase
### index
### currentTime
### olmethod