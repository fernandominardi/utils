/** =======================================================================
 * v3.5 (2018-02-02)
 * ========================================================================
 * Plugin para facilitar creación de forms que realizan llamadas ajax ante el submit.
 *
 * FORMA DE USO ----------------------------------------------------------
 * Agregar la clase 'arsis-ajax-form' en el <form> en cuestión. Con esto el plugin ya actúa sobre el form.
 * Definir el atributo 'action' del form es obligatorio, porque el valor de 'action' es el que se usa para hacer el ajax request.
 * El atributo 'method' también es usado por el plugin pero es opcional (default: GET).
 * Todas las opciones que no sean callbacks se pueden definir via data attributes.
 *
 * Ejemplo:
 *   <form class="arsis-ajax-form" action="http://url.target/del/ajax/request/" method="POST" accept-charset="UTF-8">
 *
 * Ejemplo de action en el servidor (Laravel):
 *   public function postFormTest(Request $request){
 *       // hacer cosas...
 *       $jsonRespond = [];
 *       $jsonRespond['isSuccess'] = true; // REQUIRED!
 *       $jsonRespond['successMsg'] = 'Success. Este es un mensaje desde el servidor.'; // OPCIONAL.
 *       return response()->json($jsonRespond);
 *   }
 *
 * NOTA: Este plugin espera recibir desde el servidor un JSON, que contenga la propiedad 'isSuccess' (boolean), el cual indica si la operación fué o
 * no exitosa según el servidor.
 * Y también, de forma opcional, espera recibir las propiedades successMsg y errorMsg (ver explicación de las OPCIONES successMsg y errorMsg).
 * IMPORTANTE! para este plugin:
 * - Un SUBMIT CON SUCCESS: significa que la respuesta al request se recibió con éxito, y que además se encontró isSuccess==true en el JSON de respuesta.
 * - Un SUBMIT CON ERROR: significa que la request al servidor tuvo algún error, o la respuesta fue exitosa pero NO se encontró isSuccess==true en el
 * JSON de respuesta.
 *
 * OPCIONES --------------------------------------------------------------
 * NOMBRE                           POSIBLES VALORES    DEFAULT             DESCRIPCIÓN
 * submitButtonsDisabledAtSubmitStart  boolean          true                Deshabilita los botones de tipo submit dentro del form al momento de hacer submit.
 * submitButtonsEnabledAtSubmitSuccess boolean          true                Habilita los botones de tipo submit dentro del form ante un submit con éxito.
 * submitButtonsEnabledAtSubmitError   boolean          true                Habilita los botones de tipo submit dentro del form ante un submit con error.
 *
 *
 * msgType                          false               "javascript-alert"  Indica cómo se van a mostrar los mensajes de success y error. Al ser false: No se
 *                                                                          muestra ningún mensaje en ningún caso, y deja sin uso a successMsg y errorMsg.
 *                                  "javascript-alert"                      Al ser "javascript-alert": Se usa el alert javascript del browser.
 *                                  "bootstrap-alert"                       Al ser "bootstrap-alert": Genera un alert inline de bootstrap. Para éste caso hay
 *                                                                          que definir dentro del form algún div vacío con clase ".aaf-alert-messages". Ver
 *                                                                          opción bootstrapAlertForMessages.
 *                                  "bootstrap-modal"                       Al ser "bootstrap-modal": Usa un modal bootstrap. Para éste caso hay que definir
 *                                                                          en algún lugar un modal bootstrap con id "#aff-modal-messages". Ver opción
 *                                                                          modalUsedForMessages.
 *
 * successMsg                       false|string        false               Mensaje a mostrar ante submit exitoso. Si en el JSON de respuesta se encuentra la
 *                                                                          propiedad successMsg, muestra ese mensaje en su lugar.
 *                                                                          Si successMsg no esta definido en lado cliente ni servidor, no se muestra ningún
 *                                                                          mensaje (solo un console.log()).
 *
 * errorMsg                         false|string        false               Mensaje a mostrar ante submit con error. Si en el JSON de respuesta se encuentra
 *                                                                          la propiedad errorMsg, muestra ese mensaje en su lugar. Si errorMsg no esta definido
 *                                                                          en lado cliente ni servidor (tener en cuenta que si el ajax falló, no se recibe ningún
 *                                                                          JSON de repuesta), entonces se muestra un mensaje genérico de error.
 *
 * reloadAfterSuccess               boolean             false               Self-explanatory.
 * reloadAfterError                 boolean             false               Self-explanatory.
 *
 * -- Clases y ids con significado para el plugin. El plugin busca las clases/ids dentro del form correspondiente. --
 * loadingIndicatorToShow           string              ".aaf-loading-indicator"    Selector. Elemento a ser visualizado (como un gif de loading, la palabra
 *                                                                                  Loading..., etc) mientras el request ajax esté pendiente.
 * successIndicatorToShow           string              ".aaf-success-indicator"    Selector. Elemento a ser visualizado (por unos segundos) ante submit exitoso.
 * errorIndicatorToShow             string              ".aaf-error-indicator"      Selector. Elemento a ser visualizado (por unos segundos) ante submit con error.
 *
 * bootstrapAlertForMessages        string              ".aaf-alert-messages"       Selector. Usando cuando msgType=="bootstrap-alert". Elemento a ser visualizado
 *                                                                                  para mostrar mensajes.
 * modalUsedForMessages             string              "#aff-modal-messages"       Selector. Usando cuando msgType=="bootstrap-modal". Modal a ser visualizado
 *                                                                                  para mostrar mensajes.
 *
 * -- Callbacks que se llaman ante ciertos "eventos" --
 * preSubmitCallback                false|function      false               function(). Se corre justo antes de hacer el submit, es decir, antes de la llamada
 *                                                                          ajax. Si la función preSubmitCallback retorna false, el ajax no se realiza y se
 *                                                                          corre directamente el alwaysCallback.
 * onSuccessCallback                false|function      false               function(JSON data, String textStatus). Se corre ante un submit exitoso. Nota: de
 *                                                                          ser reloadAfterSuccess==true, se hacer reload LUEGO de que se corra esta función.
 * onErrorCallback                  false|function      false               function(null|JSON data, String textStatus). Se corre ante un submit con error. Nota:
 *                                                                          de ser reloadAfterError==true, se hacer reload LUEGO de que se corra esta función.
 * alwaysCallback                   false|function      false               function(null|JSON data, String textStatus). Se corre siempre luego de concluir el ajax.
 *
 * FUNCIONES -------------------------------------------------------------
 * none.
 *
 */

(function ($) {
  /* =======================================================================
   * Función principal
   * =======================================================================*/
  $.fn.arsisAjaxForm = function (options) {
    return this.each(function () {
      if (typeof options == 'object' && options) {
        var $thisForm = $(this);
        // Si es un objeto entonces son las opciones seteadas por el developer.
        // INICIALIZACIÓN!
        var alreadyInitialized = false;

        // se extrae los settings ya definidos, o de lo contrario, se extrae los settings defaults.
        var newSettings;
        if (typeof $thisForm.data('arsisAjaxForm.settings') !== 'undefined') {
          newSettings = $thisForm.data('arsisAjaxForm.settings');
          alreadyInitialized = true;
        } else {
          newSettings = $.fn.arsisAjaxForm.defaults;
          alreadyInitialized = false;
        }

        // se mergean los settings originales con los proveídos via data-attributes.
        var dataOptions = {};
        $.each(optsAvailableViaDataAttr, function (index, optName) {
          if (typeof $thisForm.data(optName.toLowerCase()) !== 'undefined') {
            dataOptions[optName] = $thisForm.data(optName.toLowerCase());
          }
        });
        newSettings = $.extend({}, newSettings, dataOptions);

        // se mergean los settings resultante con los options proveídos via javascript.
        newSettings = $.extend({}, newSettings, options);
        $thisForm.data('arsisAjaxForm.settings', newSettings);

        $thisForm.find(newSettings.loadingIndicatorToShow).stop(true).hide();
        $thisForm.find(newSettings.successIndicatorToShow).stop(true).hide();
        $thisForm.find(newSettings.errorIndicatorToShow).stop(true).hide();
        $thisForm.find(newSettings.bootstrapAlertForMessages).stop(true).hide();
        $thisForm
          .find(newSettings.bootstrapAlertForMessages)
          .html('<div class="alert" role="alert"></div>');

        // en este punto se retorna si ya se inicializó, para no hacer binding dos beses de evento submit.
        if (alreadyInitialized) {
          return;
        }
        // definición del submit del form
        $thisForm.submit(function (event) {
          var thisFormSubmitting = this;
          var $formSubmitting = $(thisFormSubmitting);
          var settings = $formSubmitting.data('arsisAjaxForm.settings');

          // se inhabilita tudu botón de submit.
          if (settings.submitButtonsDisabledAtSubmitStart) {
            $formSubmitting.find('[type="submit"]').prop('disabled', true);
          }

          $formSubmitting
            .find(settings.successIndicatorToShow)
            .stop(true)
            .hide();
          $formSubmitting.find(settings.errorIndicatorToShow).stop(true).hide();
          $formSubmitting
            .find(settings.loadingIndicatorToShow)
            .stop(true)
            .show(250);
          $formSubmitting
            .find(settings.bootstrapAlertForMessages)
            .stop(true)
            .hide(250, function () {
              $(this).find('.alert').html('');
            });

          /* ****************
           * Esta funcionalidad para cancelar el submit se agregó a mano.
           * Se podría revisar con cuidado y agregar oficialmente en una nueva versión.
           * *****************/
          var isCancelSubmit = false;
          if (settings.preSubmitCallback !== false) {
            // función opcional para correr justo antes del submit.
            isCancelSubmit =
              false === settings.preSubmitCallback.call(thisFormSubmitting);
          }
          if (isCancelSubmit) {
            // TODO esto hay que pensar mejor!! se tiene que llamar otra función nueva(?) a ninguna(?) alguna otra idea(?)
            if (settings.alwaysCallback !== false) {
              settings.alwaysCallback.call(thisFormSubmitting, null, null);
            }
            $formSubmitting
              .find(settings.loadingIndicatorToShow)
              .stop(true)
              .hide(250);
            $formSubmitting
              .find(settings.errorIndicatorToShow)
              .stop(true)
              .show(500)
              .delay(3000)
              .hide(250);
            if (
              settings.submitButtonsEnabledAtSubmitError &&
              !settings.reloadAfterError
            ) {
              $formSubmitting.find('[type="submit"]').prop('disabled', false);
            }
            return false;
          }

          // se extrae el form method definido en el form.
          var formMethod = $formSubmitting.attr('method');
          if (typeof formMethod !== typeof undefined && formMethod !== false) {
            formMethod = formMethod.toUpperCase();
          } else {
            formMethod = 'GET';
          }

          /* TODO modularización de código:
           *   El código que se corre en los tres casos posibles (ajax exitoso y isSuccess==true | ajax exitoso pero isSuccess==false | ajax fallido)
           *   son muy similares, casi repetidas. Se puede hacer una función parametrizada, pero hay que hacer con cuidado y probar bien.
           */
          // Francis
          $.ajax({
            url: $formSubmitting.attr('action'),
            method: formMethod,
            data: new FormData(thisFormSubmitting),
            processData: false,
            contentType: false,
            dataType: 'json',
          })
            .done(function (data, textStatus, jqXHR) {
              //==== SUCCESS!! =============================================/
              var modalIsDisplayed;
              if (data.isSuccess) {
                if (settings.onSuccessCallback !== false) {
                  settings.onSuccessCallback.call(
                    thisFormSubmitting,
                    data,
                    textStatus,
                  );
                }
                if (settings.alwaysCallback !== false) {
                  settings.alwaysCallback.call(
                    thisFormSubmitting,
                    data,
                    textStatus,
                  );
                }
                $formSubmitting
                  .find(settings.loadingIndicatorToShow)
                  .stop(true)
                  .hide(250);
                $formSubmitting
                  .find(settings.successIndicatorToShow)
                  .stop(true)
                  .show(500)
                  .delay(3000)
                  .hide(250);
                if (
                  settings.submitButtonsEnabledAtSubmitSuccess &&
                  !settings.reloadAfterSuccess
                ) {
                  $formSubmitting
                    .find('[type="submit"]')
                    .prop('disabled', false);
                }
                modalIsDisplayed = showMsg(
                  $formSubmitting,
                  settings,
                  data,
                  'success',
                  textStatus,
                );
                reloadHandler(settings, 'success', modalIsDisplayed);
              } else {
                if (settings.onErrorCallback !== false) {
                  settings.onErrorCallback.call(
                    thisFormSubmitting,
                    data,
                    textStatus,
                  );
                }
                if (settings.alwaysCallback !== false) {
                  settings.alwaysCallback.call(
                    thisFormSubmitting,
                    data,
                    textStatus,
                  );
                }
                $formSubmitting
                  .find(settings.loadingIndicatorToShow)
                  .stop(true)
                  .hide(250);
                $formSubmitting
                  .find(settings.errorIndicatorToShow)
                  .stop(true)
                  .show(500)
                  .delay(3000)
                  .hide(250);
                if (
                  settings.submitButtonsEnabledAtSubmitError &&
                  !settings.reloadAfterError
                ) {
                  $formSubmitting
                    .find('[type="submit"]')
                    .prop('disabled', false);
                }
                modalIsDisplayed = showMsg(
                  $formSubmitting,
                  settings,
                  data,
                  'error',
                  'isSuccess false or undefined.',
                );
                reloadHandler(settings, 'error', modalIsDisplayed);
              }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
              //==== FAIL!! ================================================/
              var data;
              if (jqXHR.status == 422) {
                data = {
                  jsonResponse: jqXHR.responseJSON,
                  errorMsg: '',
                };
                for (var key in data.jsonResponse) {
                  if (!data.jsonResponse.hasOwnProperty(key)) {
                    continue;
                  }
                  data.errorMsg += '<p> • ' + data.jsonResponse[key] + '</p>';
                }
              } else {
                data = null;
              }
              if (settings.onErrorCallback !== false) {
                settings.onErrorCallback.call(
                  thisFormSubmitting,
                  data,
                  textStatus,
                );
              }
              if (settings.alwaysCallback !== false) {
                settings.alwaysCallback.call(
                  thisFormSubmitting,
                  data,
                  textStatus,
                );
              }
              $formSubmitting
                .find(settings.loadingIndicatorToShow)
                .stop(true)
                .hide(250);
              $formSubmitting
                .find(settings.errorIndicatorToShow)
                .stop(true)
                .show(500)
                .delay(3000)
                .hide(250);
              if (
                settings.submitButtonsEnabledAtSubmitError &&
                !settings.reloadAfterError
              ) {
                $formSubmitting.find('[type="submit"]').prop('disabled', false);
              }
              var modalIsDisplayed = showMsg(
                $formSubmitting,
                settings,
                data,
                'error',
                textStatus,
              );
              reloadHandler(settings, 'error', modalIsDisplayed);
            });

          return false;
        });
      } else if (typeof options == 'string') {
        // Si es un string entonces es el nombre de un método.

        var settings = $searchInput.data('arsisAjaxForm.settings');

        if (options === 'foo1') {
          //...
        } else if (options === 'foo2') {
          //...
        }
      }
    });
  };

  /* =======================================================================
   * Opciones default del plugin
   * =======================================================================*/
  $.fn.arsisAjaxForm.defaults = {
    submitButtonsDisabledAtSubmitStart: true,
    submitButtonsEnabledAtSubmitSuccess: true,
    submitButtonsEnabledAtSubmitError: true,

    msgType: 'javascript-alert',
    successMsg: false,
    errorMsg: false,

    reloadAfterSuccess: false,
    reloadAfterError: false,

    loadingIndicatorToShow: '.aaf-loading-indicator',
    successIndicatorToShow: '.aaf-success-indicator',
    errorIndicatorToShow: '.aaf-error-indicator',
    bootstrapAlertForMessages: '.aaf-alert-messages',
    modalUsedForMessages: '#aff-modal-messages',

    preSubmitCallback: false,
    onSuccessCallback: false,
    onErrorCallback: false,
    alwaysCallback: false,
  };

  var optsAvailableViaDataAttr = [
    'submitButtonsDisabledAtSubmitStart',
    'submitButtonsEnabledAtSubmitSuccess',
    'submitButtonsEnabledAtSubmitError',

    'msgType',
    'successMsg',
    'errorMsg',

    'reloadAfterSuccess',
    'reloadAfterError',

    'loadingIndicatorToShow',
    'successIndicatorToShow',
    'errorIndicatorToShow',
    'bootstrapAlertForMessages',
    'modalUsedForMessages',

    'preSubmitCallback',
    'onSuccessCallback',
    'onErrorCallback',
    'alwaysCallback',
  ];

  /* =======================================================================
   * Binding automático
   * =======================================================================*/
  $(function () {
    $('form.arsis-ajax-form').arsisAjaxForm({});
  });

  /* =======================================================================
   * Private functions
   * =======================================================================*/

  /**
   * Imprime el mensaje correspondiente.
   * Retorna true si es que se abrió un modal para imprimir el mensaje.
   */
  function showMsg($form, settings, data, errorOrSuccess, textStatus) {
    if (data == null) {
      data = {};
    }
    errorOrSuccess = errorOrSuccess.toLowerCase();
    var isErrorCase = errorOrSuccess === 'error';
    var msgVarName = errorOrSuccess + 'Msg';

    if (settings.msgType == false) {
      if (isErrorCase) {
        console.log('arsis-ajax-form error');
      } else {
        console.log('arsis-ajax-form success');
      }
      return false;
    }

    var msg;
    // se busca primero el mensaje en el JSON recibido.
    if (
      data.hasOwnProperty(msgVarName) &&
      data[msgVarName] !== false &&
      data[msgVarName] !== null
    ) {
      msg = data[msgVarName];
      // sino, se busca el definido en lado cliente.
    } else if (settings[msgVarName] !== false) {
      msg = settings[msgVarName];
      // si no se encontró el mensaje en lado cliente ni servidor.
    } else {
      // en caso de ser error se muestra un mensaje genérico.
      if (isErrorCase) {
        msg = 'Se ha producido un error.';
        msg += settings.msgType == 'javascript-alert' ? '\n' : '<br>';
        msg += 'Detalles técnicos: ' + textStatus;
        // en caso de success no se muestra mensaje.
      } else {
        console.log('arsis-ajax-form success');
        return false;
      }
    }

    /*if(isErrorCase){
         msg += settings.modalUsedForMessages!==false? '<br>' : '\n';
         msg += 'Detalles técnicos: '+textStatus;
         }*/

    if (settings.msgType == 'javascript-alert') {
      alert(msg);
      return false;
    } else if (settings.msgType == 'bootstrap-alert') {
      var $bAlertContainer = $form.find(settings.bootstrapAlertForMessages);
      $bAlertContainer.hide(250, function () {
        var $bAlert = $(this).find('.alert');
        $bAlert.removeClass().html(msg);
        if (isErrorCase) {
          $bAlert.addClass('alert alert-danger');
        } else {
          $bAlert.addClass('alert alert-success');
        }
        $(this).show(500);
      });
    } else if (settings.msgType == 'bootstrap-modal') {
      var $msgModal = $(settings.modalUsedForMessages);
      if (isErrorCase) {
        $msgModal
          .find('.modal-content')
          .find('.modal-header')
          .find('.modal-title')
          .text('Error');
        $msgModal
          .find('.modal-content')
          .find('.modal-header')
          .find('.modal-title')
          .addClass('text-danger');
      } else {
        $msgModal
          .find('.modal-content')
          .find('.modal-header')
          .find('.modal-title')
          .text('Acción exitosa');
      }
      $msgModal.find('.modal-content').find('.modal-body').html(msg);
      $msgModal.modal('show');
      return true;
    } else {
      return false;
    }
  }

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  function reloadHandler(settings, errorOrSuccess, modalIsDisplayed) {
    if (settings['reloadAfter' + errorOrSuccess.capitalize()]) {
      if (modalIsDisplayed) {
        $(settings.modalUsedForMessages).on('hidden.bs.modal', function (e) {
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    }
  }
})(jQuery);
