# encrypted-gist


Store any type of file by uploading them to GitHub as encrypted text files. (Compatible only with Chrome and Firefox, see [Limitations](#limitations))

The code is fairly simple, 30 lines for the [GitHub API](src/github.ts), 200 lines for [everything else](src/main.tsx). There are no dependencies.

**Update 2018-09: Sadly GitHub no longer allows the creation of gists without login. This means that uploading new files will no longer work**

#### Hosted version:

https://phiresky.github.io/encrypted-gist/

#### Sample image:

https://phiresky.github.io/encrypted-gist/#1sEvMfJVEedVYQ!MxxLThUm9bwx5ECH6z0UlQ

which is stored in this Gist: https://gist.github.com/anonymous/d6c12f31f25511e75561

#### Sample audio file:

https://phiresky.github.io/encrypted-gist/#hEYvbZypBIsr7w!ZpNA6hisoEF-9Cnk2uVmjw

---

For a while, imgur was the perfect image hoster. No bullshit, simple interface, allows private uploads.
But they have become a complete social network, even [covertly redirecting direct .jpg requests to their
(ad- and meme-filled) gallery pages](http://minimaxir.com/2014/02/moved-temporarily/).

I often send screenshots, so I need somewhere to put my images. I hate it when links stop working, so
self-hosting isn't really a solution for me because I don't want to maintain a permanent server.

So I had the *genius* idea to use github repositories or gists as a raw file storage, encrypting the 
files client-side so only the people I send the link to can view them.

The terms of service of github don't disallow this (but I'm not sure if they like it, so don't use it for important or huge stuff).

Starting with only image uploads, I expanded it to work for any file type.

## How it works

### Uploading

1. Show file dialog, load file into memory, prepend metadata as JSON.
3. Encrypt it using AES-GCM 128bit, which also ensures authentication.
4. Send base64-encoded file to [github gist api](https://developer.github.com/v3/gists/), creating an anonymous gist.
5. Create link based on gist id and encryption key. The key is put into the url hash so it is never sent to any server.

### Viewing

1. Get encryption key and location from url fragment
2. Download file from API
3. Decrypt file
3. View file according its metadata

This tool also had support for uploading the files to github repositories, 
but I removed that because it was a hassle ([see here](https://github.com/phiresky/encrypted-gist/commit/5fdd0aa003d97bc2e5d8c548a9f7b4a714406a24)).

## Limitations

* Mostly client side, so uses a fair amount of processing power and direct embedding of the images is not possible
* Github API is fairly limited, so this wastes some data and is slow when images are > 750 kB. I also added an arbitrary limit of 5 MB, though the API supports more.
* Github might block this if it's used a lot (though I'm not sure how that would be possible except for disabling the API)
* Tested on Chrome and Firefox, that's probably it because this uses very new features 
([crypto api](https://developer.mozilla.org/en-US/docs/Web/API/Crypto),
[fetch api](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) and generators for async/await) 

## Building

"Binaries" are included.

Written using Typescript/ES2016 with async/await. Get Typescript, run `npm install babel` and start the build watch with `./build.js`
