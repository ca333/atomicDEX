# atomicDEX v0.1

SPV lightweight GUI wallet for KMD and BTCH. This is experimental software and a functional
prototype. This project is being currently ported to atomicDEX QT.


## Install dependencies

### OSX / LINUX

```
curl https://install.meteor.com/ | sh
git clone https://github.com/ca333/atomicDEX
cd atomicDEX
meteor npm install --save sweetalert
meteor npm install --save pm2 fs-extra fix-path
```

run the aotomicDEX GUI: (current version has only OSX/WIN version of the komodoplatformdaemon included)
```
meteor run
```

### LINUX

Follow the instructions from above (OSX) and place your marketmaker executable inside `private/static/LINUX`in the atomicDEX directory. 

### WIN

Install chocolatey from https://chocolatey.org/install and afterwards install meteor via administrator command prompt:

`choco install meteor`
