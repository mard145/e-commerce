(function( $ ) {
	'use strict';

	/**
	 * All of the code for your public-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */

    jQuery(document).ready(function(){
        const inputFile = document.getElementById('upload_photos');
        const myAccountLink = jQuery('#Side_slide').find('a#myaccount_button');

        if(myAccountLink){
            myAccountLink.append('<span style="margin-left: 5px">Minha Conta</span>');
        }
        if(inputFile){
            inputFile.addEventListener("change", uploadPhotos);
        }
    });
})( jQuery );


function handleSubmitSaveProfile(event){
    event.preventDefault();
    const form              = document.getElementById('form-save-profile'),
        formElement         = event.target,
        { action, method }  = formElement,
        payload             = new FormData(form),
        inputs              = form.querySelectorAll('input, textarea, select'),
        submitBtn           = form.querySelector('button[type="submit"]'),
        spinner             = jQuery('.dot-spinner'),
        responseEl          = jQuery('.response');
    
    submitBtn.disabled = true;
    spinner.removeClass('d-none');
    fetch(action, {
        method: method,
        body: payload
    })
    .then(response => response.json())
    .then( data => {
        const response = JSON.stringify(data);
        responseEl.removeClass('d-none');
        spinner.addClass('d-none');
        responseEl.text('Perfil salvo com sucesso!');
        console.log(data);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    })
    .catch(error => console.error(error));
}

function uploadPhotos(event){
    const files     = event.target.files,
        payload     = new FormData(),
        endpoint    = `${rest.url}easybag/v1/upload-image`,
        method      = 'POST',
        inputPhotos = jQuery('#body_photos'),
        wrapPhotos  = jQuery('#profile-photos .swiper-container .swiper-wrapper');

    for(let index = 0; index < files.length; index++){
    
        payload.append('image', files[index]);
        // payload.append('nonce', rest.nonce);

        fetchAsync(endpoint, method, payload).then(data => {
            if(data.code === 'invalid_file_type' || data.code === 'upload_error'){
                console.log('erro');
            } else {
                let currVal = inputPhotos.val(),
                    newVal = currVal + ',' + data.attachId,
                    output = `<div class="photo-item">
                            <img src="${data.url}" alt="" class="" />
                            <button type="button" class="btn-remove-photo" onclick="removePhoto(jQuery(this), ${data.attachId})">Remover</button>
                        </div>`;

                inputPhotos.val(newVal);
                wrapPhotos.append(output);
            }
            setTimeout(() => {
                
            }, 100);
        }).catch(error => {
            console.error(error);
        });
    }
}

function removePhoto(btn, id){
    btn.attr('disabled', true);
    const attachIds = jQuery('#body_photos'),
        parentEl    = btn.parent(),
        payload     = new FormData(),
        method      = 'POST',
        endpoint    = `${rest.url}easybag/v1/delete-image`;

    payload.append('id', id);
    payload.append('nonce', rest.nonce);

    fetchAsync(endpoint, method, payload).then(data => {
        if(data.code === 'error'){
            
        } else {
        }
        let currAttachs = attachIds.val().split(','),
            updateListIds = currAttachs.filter(item => item !== ''+id+''),
            newStringIds = updateListIds.join(',');
        attachIds.val(newStringIds);
        setTimeout(() => {
            parentEl.remove();
        }, 100);
    }).catch(error => {
        console.log(error);
    });
}

async function fetchAsync(endpoint, method, payload){
    try{
        let response = await fetch(endpoint, {
            method: method,
            body: payload,
        });
        if(!response.ok){
            throw new Error('Erro na requisição');
        }

        const data = await response.json();
        console.log(data);
        return data;
    }
    catch(error){
        console.error(error);
        throw new Error('Erro na requisição');
    }
}

// Função para fazer a requisição utilizando fetch com async/await -- Não está funcionando;
async function getVariations(url, headers) {
    const options = {
        method: 'GET',
        headers: headers
    };
    const variations = [];

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if(data.variations) {
            variations.push(data.attributes)
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }

    return variations;
}

function addToCart(btn, product_id, quantity = 1){
	// let's check is add-to-cart.min.js is enqueued and parameters are presented
	if ( 'undefined' === typeof wc_add_to_cart_params ) {
		return false;
	}

	jQuery.post( 
		wc_add_to_cart_params.wc_ajax_url.toString().replace( '%%endpoint%%', 'add_to_cart' ),
		{
			product_id: product_id, 
			quantity: quantity, // quantity is hardcoced her
		},
		function( response ) {
			if ( ! response ) {
				return;
			}
			// redirect is optional and it depends on what is set in WooCommerce configuration
			if ( response.error && response.product_url ) {
				window.location = response.product_url;
				return;
			}
			if ( 'yes' === wc_add_to_cart_params.cart_redirect_after_add ) {
				window.location = wc_add_to_cart_params.cart_url;
				return;
			}

            console.log(btn);
            const successMsg = btn.siblings('span'),
                tr = btn.parents('tr');

            btn.addClass('d-none');
            successMsg.removeClass('d-none');
            tr.addClass('success-background');
            
			// refresh cart fragments etc
			jQuery( document.body ).trigger( 'added_to_cart', [ response.fragments, response.cart_hash ] );
		}
	);
}

async function salvarIdProdutoNoCarrinho(cartItemKey, idProduto) {
    try {
        const url = `/wp-json/wc/v3/cart/cart-item-data/${cartItemKey}`;
        const data = {
            product_id: idProduto
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa('ck_a23a8e2600fb423476294938b4a12c480ac9fb42:cs_c5ead328ee7762647e3ad2778308630c699c57af') // Substitua com suas chaves de autenticação
            },
                body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('ID do produto salvo como meta-campo no carrinho com sucesso!');
        } else {
            console.log('Falha ao salvar o ID do produto como meta-campo no carrinho:', responseData.message);
        }
    } catch (error) {
        console.error('Erro ao salvar ID do produto como meta-campo no carrinho:', error);
    }
}


/**
 * Função para imprimir bag
 */
function printBag(elementId) {
    const originalElement = jQuery(`#${elementId}`),
        clonedEl = originalElement.clone(),
        textPreTable = jQuery('#text-pre-table').text(),
        textFooter = jQuery('#text-footer').text(),
        customerData = JSON.parse(jQuery('#customer-infos').val());

    clonedEl.find('table').attr('style', 'width: 100%;border-collapse: collapse;margin-bottom: 20px;');
    clonedEl.find('th').attr('style', 'border: 1px solid #ccc;padding: 10px;text-align: left;');
    clonedEl.find('td').attr('style', 'border: 1px solid #ccc;padding: 10px;text-align: left;');
    clonedEl.find('img').attr('style', 'max-width: 36px; height: auto;');

    const table = clonedEl.html();
    const janelaDeImpressao = window.open('', '', 'width=960, height=680');
    janelaDeImpressao.document.write(`<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Detalhes do Pedido</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    border: 1px solid #ccc;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                }
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .table th, .table td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: left;
                }
                @media print {
                    .d-print-none{display:none;}
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Detalhes da Bag</h1>
                </div>
                <div class="customer-details">
                    <h3>Cliente:</h3>
                    <p><strong>Nome completo:</strong> ${customerData.full_name}</p>
                    <p><strong>Endereço:</strong> ${customerData.billing.address_1}</p>
                    <p><strong>Cidade - CEP:</strong> ${customerData.billing.city} - ${customerData.billing.postcode}</p>
                </div>
                <div class="order-details">
                    <p><strong>ID da Bag:</strong> #${customerData.bag}</p>
                    <p><strong>Data:</strong> ${customerData.date}</p>
                </div>
                <div class="contact-details">
                    <p><strong>E-mail:</strong> ${customerData.email}</p>
                    <p><strong>Telefone:</strong> ${customerData.whatsapp}</p>
                </div>
                <p>Esse borderô foi conferido com amor por: ${customerData.supervisor}</p>
            </div>
            <div class="container">
                <p>${textPreTable}</p>
            </div>
            <table class="table">
                ${table}
            </table>
            <div class="container">
                <p>${textFooter}</p>
            </div>
        </body>
    </html>`);
    janelaDeImpressao.document.close();
    janelaDeImpressao.print();
    janelaDeImpressao.close();
}

/**
 * Adicionar produto no carrinho com jquery
 * créditos https://rudrastyh.com/woocommerce/add-product-to-cart-programmatically.html
 */
function addSubscriptionToCart(product_id, quantity = 1) {

    // let's check is add-to-cart.min.js is enqueued and parameters are presented
    if ( 'undefined' === typeof wc_add_to_cart_params ) {
        return false;
    }

    jQuery.post( 
        wc_add_to_cart_params.wc_ajax_url.toString().replace( '%%endpoint%%', 'add_to_cart' ), 
        {
            product_id: product_id, 
            quantity: quantity,
        }, 
        function( response ) {
            console.log(response);
            if(!response){
                return;
            }
            if(response.error && response.product_url){
                // window.location = response.product_url;
                return;
            }
            if ( 'yes' === wc_add_to_cart_params.cart_redirect_after_add ) {
                // window.location = wc_add_to_cart_params.cart_url;
                return;
            }
            // refresh cart fragments etc
            jQuery( document.body ).trigger( 'added_to_cart', [ response.fragments, response.cart_hash ] );
            alert('Assinatura adicionada ao carrinho!');
        }
    );
}