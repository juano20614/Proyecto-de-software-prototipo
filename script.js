function switchTab(tab) {
    document.getElementById('btn-tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('btn-tab-register').classList.toggle('active', tab === 'register');
    
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
    
    hideAlert();
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.className = `alert-message alert-${type}`;
    alertBox.style.display = 'block';
}

function hideAlert() {
    const alertBox = document.getElementById('alert-box');
    alertBox.style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-email').value;
    const roleInput = document.getElementById('login-role');
    const role = roleInput ? roleInput.value : 'pasajero';

    showAlert(`Cargando cuenta de ${role.toUpperCase()}...`, 'success');
    
    // Guardar los datos del usuario para el nuevo archivo
    localStorage.setItem("seti_user", userInput);
    localStorage.setItem("seti_role", role);

    // Redirección al nuevo archivo HTML
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 800);
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    showAlert(`¡Cuenta creada con éxito para ${name}! Inicia sesión.`, 'success');
    setTimeout(() => {
        switchTab('login');
    }, 1200);
}

function handleBiometricLogin() {
    showAlert('Escaneando huella / rostros del smartphone...', 'success');
    
    localStorage.setItem("seti_user", "pasajero_movil@armenia.gov.co");
    localStorage.setItem("seti_role", "pasajero");

    setTimeout(() => {
        showAlert('Verificación biométrica aprobada.', 'success');
        setTimeout(() => {
            window.location.href = "dashboard.html"; // Redirección
        }, 500);
    }, 800);
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html"; // Regresar al Login
}