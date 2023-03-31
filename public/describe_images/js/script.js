const azureComputerVisionApiKey = 'f1f4066d3e494029b4e7abcfc023e684';
const azureComputerVisionApiEndpoint = 'https://jsugg-image-explained.cognitiveservices.azure.com/vision/v3.2/describe';
const GCPTranslationApiKey = 'AIzaSyBiCSFtKcsppnSuIiHBBHimcW2QE_byWis';
const GCPTranslationApiEndpoint = 'https://translation.googleapis.com/language/translate/v2';
let scrappedImages;

const iframe = document.createElement('iframe');
iframe.setAttribute('id', 'iframe');
iframe.setAttribute('frameborder', '0');
const iframeWrapper = document.createElement('div');
iframeWrapper.setAttribute('id', 'iframewrapper');
iframeWrapper.appendChild(iframe);
const inputUrl = document.createElement('input');
inputUrl.setAttribute('id', 'url-input')
inputUrl.setAttribute('validurl', '');
const button = document.createElement('button');
button.setAttribute('style', 'display: none;');
button.setAttribute('class', 'btn');
const label = document.createElement('label');
label.setAttribute('id', 'input-label');
const notifications = document.createElement('div');
notifications.setAttribute('id', 'notifications');
const notificationText = document.createElement('span');
notificationText.setAttribute('id', 'notificationtext');
notifications.appendChild(notificationText);
const eta = document.createElement('span');
eta.setAttribute('id', 'countdown');
notifications.appendChild(eta);
const spinner = document.createElement('div');
spinner.classList.add('lds-roller');
[...Array(8)].forEach((_, i) => spinner.appendChild(document.createElement('div')));
spinner.setAttribute('style', 'display: none');
notifications.appendChild(spinner);
const results = document.createElement('div');
results.setAttribute('id', 'results');
notifications.appendChild(results);
inputUrl.setAttribute('type', 'text');
inputUrl.setAttribute('placeholder', 'https://www.example.com');
inputUrl.setAttribute('id', 'url-input');
button.innerText = 'Get image descriptions';
label.innerText = 'Paste the website URL here';

// Helper function to wait for something to happen before continuing
const waitUntil = async (conditionFunction) => {
  const poll = (resolve) => {
    if (conditionFunction()) resolve();
    else setTimeout(() => poll(resolve), 2000);
  };

  return new Promise(poll);
};

async function getImagesFromApi(url) {
    try {
      const apiUrl = 'https://alt-text-generator-zhsb.onrender.com/api/scrapper/images';
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        rejectUnauthorized: false,
        mode: 'no-cors'
      };
      const response = await fetch(`${apiUrl}?url=${encodeURIComponent(url)}`, options);
  
      if (!response.ok) {
        throw new Error(`Error fetching images: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } 
    catch (error) {
      console.error('Error fetching images:', error);
    }
  }

function toggleButton(action) {
    if (action == 'enable') {
        button.disabled = false;
        button.classList.add('success');
        inputUrl.classList.add('valid');
    } else if (action == 'disable') {
        button.disabled = true;
        button.classList.remove('success');
        inputUrl.classList.remove('success');
    } else if (action == 'hide') {
        button.setAttribute('style', 'display: none;');
    } else if (action == 'show') {
        button.setAttribute('style', 'display: block;');
    }
}

function toggleInput(action) {
    if (action == 'invalid') 
    {
        inputUrl.classList.remove('valid');
        inputUrl.classList.add('invalid');
        inputUrl.setAttribute('validurl', 'false');
    } 
    else if (action == 'valid') {
        inputUrl.classList.remove('invalid');
        inputUrl.classList.add('valid');
        inputUrl.setAttribute('validurl', 'true');
    } 
    else if (action == 'clear') {
        inputUrl.classList.remove('valid');
        inputUrl.classList.remove('invalid');
        inputUrl.setAttribute('validurl', '');
    }
}

async function loadValidUrl() {
  if (inputUrl.getAttribute('validurl') == 'true') 
    {
      const validUrl = inputUrl.value;
      notificationText.textContent = '';
      iframe.addEventListener('load', () => {
        toggleButton('show');
      });
      iframe.setAttribute('src', `${validUrl}`);
      scrappedImages = await getImagesFromApi(inputUrl.value);
      notificationText.textContent = `Found ${scrappedImages.length} images.`
    } 
    else { 
      toggleInput('invalid');
    }
}
// Handles the request to load the website inside the iFrame on paste
inputUrl.addEventListener('paste', async function(evt) {
  await loadValidUrl();
}, false);
// Handles the request to load the website inside the iFrame on keypress == Enter
inputUrl.addEventListener( 'keypress', async function(evt) {
  if (evt.key === 'Enter')
    await loadValidUrl();
})
//});

// Handles the input of the website url 
inputUrl.addEventListener('input', () => {
  const domain = inputUrl.value.match(/^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i);
  toggleInput('clear');
  if (domain) 
  {
    toggleInput('valid')
    toggleButton('enable');
    notificationText.innerHTML = 'Press Enter';
  } 
  else {
    toggleInput('invalid')
    toggleButton('disable');
    notificationText.innerHTML = '';
  }
});

// Handles the Get Descriptions button
button.addEventListener('click', async () => {
  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;

  async function describeImage(imgSrc) {
    const response = await fetch(`${azureComputerVisionApiEndpoint}?maxCandidates=4&language=pt&model-version=latest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': azureComputerVisionApiKey,
        'origin': inputUrl.value
      },
      body: JSON.stringify({ url: imgSrc }),
    });
    const data = await response.json();
    _ = []
    for (const caption in data) {
      _.push(caption)
    }

    const captions = data.description.captions.map(caption => caption.text);
    console.log(`Captions: [${typeof captions}] ${captions}`);
    return captions;
  }

  // Deprecated
  async function translateText(captions) {
    //const response = await fetch(`${GCPTranslationApiEndpoint}?q=${text}&target=pt&key=${GCPTranslationApiKey}`);
    //const data = await response.json();
    //const translatedCaptionsData = captions.map(text => fetch(`${GCPTranslationApiEndpoint}?q=${text}&target=pt&key=${GCPTranslationApiKey}`).then(response => response.json()));
    //const translatedCaptionsData = captions.map(text => fetch(`${GCPTranslationApiEndpoint}?q=${text}&target=pt&key=${GCPTranslationApiKey}`).then(response => response.json()).then(data => data)); 
    const translatedCaptionsData = await Promise.all(captions.map(async text => {
      const response = await fetch(`${GCPTranslationApiEndpoint}?q=${text}&target=pt&key=${GCPTranslationApiKey}`);
      return response.json();
    }));
    console.log(`translatedCaptionsData: ${JSON.stringify(translatedCaptionsData)}`);
    console.log(`translatedCaptionsData.map: ${translatedCaptionsData.map(translation => (translation.translatedText))}`);
    return translatedCaptionsData.map(translation => (translation.translatedText));
    //const translation = data.data.translations[0].translatedText;
    //return translation;
  }

  // Countdown timer function
  function countdownTimer(initialSeconds) {
    const targetTime = new Date().getTime() + initialSeconds * 1000;
  
    function updateTimer() {
      const now = new Date().getTime();
      const timeRemaining = targetTime - now;
  
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
      let countdownText = "";
      if (days > 0) countdownText += days + "d ";
      if (hours > 0) countdownText += hours + "h ";
      if (minutes > 0) countdownText += minutes + "m ";
      if (seconds > 0) countdownText += seconds + "s ";
  
      document.getElementById("countdown").innerHTML = 'ETA: ' + countdownText;
  
      if (timeRemaining < 0) {
        clearInterval(interval);
        document.getElementById("countdown").innerHTML = "Almost there...";
      }
    }
    const interval = setInterval(updateTimer, 1000);
  }

  async function autoAltTextV2(images) {
    toggleButton('disable');
    spinner.setAttribute('style', 'display: inline-block');

    const altTextList = [];
      interval = 3000;
    function delay(interval) {
      return new Promise(resolve => setTimeout(resolve, interval));
    }
    countdownTimer(images.length*3);

    for (const img in images) {
      const row = document.createElement('div');
      row.classList.add('result');
      const imgElement = document.createElement('img');
      imgElement.classList.add('result-img')
      const altTextDiv = document.createElement('div'); 
      altTextDiv.classList.add('alt-text');

      notificationText.innerHTML = 'Requesting description...';
      const description = await describeImage(images[img]);
      notificationText.innerHTML = 'Requesting translation...';
      // Deprecated
      // const altText = await translateText(description).then(altText => altText.join('\n'));
      const altText = description.join('<br/>');

      imgElement.setAttribute('src', images[img]);
      //imgElement.setAttribute('width', '200');
      altTextDiv.innerHTML = altText;

      row.append(imgElement);
      row.append(altTextDiv);
      results.appendChild(row);
      altTextList.push({ imageUrl: images[img], altText });

      await delay(interval);
    }
    toggleButton('enable')
    return altTextList;
  }

  // Collect the website images
  //const scrappedImages = await getImagesFromApi(inputUrl.value);

  // Collect and translate the descriptions
  const altTextListV2 = await autoAltTextV2(scrappedImages);
  
  notificationText.innerHTML = '';
  eta.innerHTML = '';
  spinner.setAttribute('style', 'display: none');
});

document.body.append(label, inputUrl, button, notifications, iframeWrapper);
