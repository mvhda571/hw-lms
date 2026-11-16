const form = document.querySelector('#entry-form');
const numberInput = document.querySelector('#vehicle-number');
const spaceSelect = document.querySelector('#space-id');
const message = document.querySelector('#message');
const spacesList = document.querySelector('#spaces-list');

async function loadSpaces() {
  const response = await fetch('/api/spaces');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Joylar holatini yuklab bo‘lmadi');
  }

  const selectedSpace = spaceSelect.value;
  spaceSelect.replaceChildren();
  spacesList.replaceChildren();

  for (const space of data.spaces) {
    const option = document.createElement('option');
    option.value = space.id;
    option.textContent = space.vehicleNumber
      ? `${space.label} — band`
      : `${space.label} — bo‘sh`;
    spaceSelect.append(option);

    const row = document.createElement('tr');
    const labelCell = document.createElement('td');
    const statusCell = document.createElement('td');
    const numberCell = document.createElement('td');
    const badge = document.createElement('span');

    labelCell.textContent = space.label;
    badge.className = space.vehicleNumber ? 'badge occupied' : 'badge available';
    badge.textContent = space.vehicleNumber ? 'Band' : 'Bo‘sh';
    statusCell.append(badge);
    numberCell.textContent = space.vehicleNumber || '—';
    row.append(labelCell, statusCell, numberCell);
    spacesList.append(row);
  }

  if (data.spaces.some((space) => String(space.id) === selectedSpace)) {
    spaceSelect.value = selectedSpace;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.className = 'message';

  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNumber: numberInput.value,
        spaceId: spaceSelect.value,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.message || 'So‘rovni bajarib bo‘lmadi';
      message.classList.add('error');
      await loadSpaces();
      return;
    }

    message.textContent = data.message;
    message.classList.add('success');
    numberInput.value = '';
    await loadSpaces();
  } catch (error) {
    message.textContent = error.message || 'Server bilan bog‘lanib bo‘lmadi';
    message.classList.add('error');
  }
});

document.querySelector('#refresh-button').addEventListener('click', async () => {
  try {
    await loadSpaces();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'message error';
  }
});

loadSpaces().catch((error) => {
  message.textContent = error.message;
  message.className = 'message error';
});
