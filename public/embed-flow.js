(function () {
  // Find the current script tag to read data attributes
  var scripts = document.querySelectorAll('script[data-site]');
  var script = scripts[scripts.length - 1];

  if (!script) {
    console.error('LCO Flow Widget: Missing data-site attribute on script tag.');
    return;
  }

  var siteCode = script.getAttribute('data-site');
  if (!siteCode) {
    console.error('LCO Flow Widget: data-site attribute is empty.');
    return;
  }

  // Determine the base URL from the script src
  var src = script.getAttribute('src') || '';
  var baseUrl = src.replace(/\/embed-flow\.js.*$/, '');

  // Create container
  var container = document.createElement('div');
  container.style.width = '100%';
  container.style.maxWidth = '800px';
  container.style.margin = '24px auto';

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/embed/flow?site=' + encodeURIComponent(siteCode);
  iframe.style.width = '100%';
  iframe.style.height = '480px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Real-time river flow data');

  container.appendChild(iframe);

  // Insert after the script tag
  script.parentNode.insertBefore(container, script.nextSibling);
})();
