/** =======================================================================
 * v1.2 (2016-05-24)
 * ========================================================================
 * Plugin para monitorear si el form tiene input modificados (dirty).
 * También tiene la opción de mostrar una confirmación para salir de la página si el form se encuentra en estado dirty.
 *
 * Este plugin es un wrapper de jquery.AreYouSure.
 * La idea de arsis-dirty-form es dar una interfaz sencilla para inicializar jquery.AreYouSure con las configuraciones más frecuentes y útiles.
 * Otra ventaja es que los options de arsis-dirty-form son accesibles via data-attributes.
 * ArsisDirtyForm ya inicializa jquery.AreYouSure en el form dado, por lo que es posible usar directamente el API de dicho plugin si es necesario
 * (github.com/codedance/jquery.AreYouSure).
 *
 * FORMA DE USO ----------------------------------------------------------
 * Agregar la clase 'arsis-dirty-form' en el <form> en cuestión. Con esto el plugin ya actúa sobre el form.
 * Las opciones son definibles via data attributes.
 *
 * OPCIONES --------------------------------------------------------------
 * NOMBRE                           POSIBLES VALORES    DEFAULT                     DESCRIPCIÓN
 * submitEnableOnlyWhenFormDirty    boolean             true                        Self-explanatory ;-)
 * confirmToLeavePageWhenDirty      boolean             true                        Self-explanatory ;-)
 * confirmMsg                       string              'Hay cambios sin guardar.'  Self-explanatory ;-)
 * addRemoveFieldsMarksDirty        boolean             false                       Determina si un cambio en la cantidad de inputs en el form significa
 *                                                                                  dirty. Nota: Cuidado con plugins que por debajo agregan y/o quitan inputs.
 *
 * FUNCIONES -------------------------------------------------------------
 * none.
 *
 */

(function ($) {
  /* =======================================================================
   * Función principal
   * =======================================================================*/
  $.fn.arsisDirtyForm = function (options) {
    return this.each(function () {
      if (typeof options == 'object' && options) {
        var $thisForm = $(this);
        // Si es un objeto entonces son las opciones seteadas por el developer.
        // INICIALIZACIÓN!

        /* INICIO DEL PROCESO DE GUARDAR LOS SETTINGS */
        //var alreadyInitialized = false;

        // se extrae los settings ya definidos, o de lo contrario, se extrae los settings defaults.
        var newSettings;
        if (typeof $thisForm.data('arsisDirtyForm.settings') !== 'undefined') {
          newSettings = $thisForm.data('arsisDirtyForm.settings');
          //alreadyInitialized = true;
        } else {
          newSettings = $.fn.arsisDirtyForm.defaults;
          //alreadyInitialized = false;
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
        $thisForm.data('arsisDirtyForm.settings', newSettings);
        /* FIN DEL PROCESO DE GUARDAR LOS SETTINGS */

        var aysOptions = {};

        aysOptions.addRemoveFieldsMarksDirty =
          newSettings.addRemoveFieldsMarksDirty;

        if (!newSettings.confirmToLeavePageWhenDirty) {
          aysOptions.silent = true;
        } else {
          aysOptions.message = newSettings.confirmMsg;
        }

        if (newSettings.submitEnableOnlyWhenFormDirty) {
          $thisForm.find('[type="submit"]').prop('disabled', true);
          aysOptions.change = function () {
            // Enable save button only if the form is dirty. i.e. something to save.
            if ($(this).hasClass('dirty')) {
              $(this).find('[type="submit"]').prop('disabled', false);
            } else {
              $(this).find('[type="submit"]').prop('disabled', true);
            }
          };
        }

        $thisForm.areYouSure(aysOptions);
        $thisForm.trigger('checkform.areYouSure');
      } else if (typeof options == 'string') {
        // Si es un string entonces es el nombre de un método.

        var settings = $searchInput.data('arsisDirtyForm.settings');

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
  $.fn.arsisDirtyForm.defaults = {
    submitEnableOnlyWhenFormDirty: true,
    confirmToLeavePageWhenDirty: true,
    confirmMsg: 'Hay cambios sin guardar.',
    addRemoveFieldsMarksDirty: false,
  };

  var optsAvailableViaDataAttr = [
    'submitEnableOnlyWhenFormDirty',
    'confirmToLeavePageWhenDirty',
    'confirmMsg',
    'addRemoveFieldsMarksDirty',
  ];

  /* =======================================================================
   * Binding automático
   * =======================================================================*/
  $(function () {
    $('form.arsis-dirty-form').arsisDirtyForm({});
  });

  /* =======================================================================
   * Private functions
   * =======================================================================*/
})(jQuery);

/*!
 * jQuery Plugin: Are-You-Sure (Dirty Form Detection)
 * https://github.com/codedance/jquery.AreYouSure/
 * http://www.papercut.com/products/free-software/are-you-sure/demo/are-you-sure-demo.html
 *
 * Copyright (c) 2012-2014, Chris Dance and PaperCut Software http://www.papercut.com/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Author:  chris.dance@papercut.com
 * Version: 1.9.0
 * Date:    13th August 2014
 */
(function ($) {
  $.fn.areYouSure = function (options) {
    var settings = $.extend(
      {
        message: 'You have unsaved changes!',
        dirtyClass: 'dirty',
        removeDirtyClassAtSubmit: true,
        change: null,
        silent: false,
        addRemoveFieldsMarksDirty: true, // NOTA (fet): Esta en una opción que yo le agregué al plugin :P hack hack.
        fieldEvents: 'change keyup propertychange input',
        fieldSelector: ':input:not(input[type=submit]):not(input[type=button])',
      },
      options,
    );

    var getValue = function ($field) {
      if (
        $field.hasClass('ays-ignore') ||
        $field.hasClass('aysIgnore') ||
        $field.attr('data-ays-ignore') ||
        $field.attr('name') === undefined
      ) {
        return null;
      }

      if ($field.is(':disabled')) {
        return 'ays-disabled';
      }

      var val;
      var type = $field.attr('type');
      if ($field.is('select')) {
        type = 'select';
      }

      switch (type) {
        case 'checkbox':
        case 'radio':
          val = $field.is(':checked');
          break;
        case 'select':
          val = '';
          $field.find('option').each(function (o) {
            var $option = $(this);
            if ($option.is(':selected')) {
              val += $option.val();
            }
          });
          break;
        default:
          val = $field.val();
      }

      return val;
    };

    var storeOrigValue = function ($field) {
      if ($field.data('ays-orig') == null) {
        $field.data('ays-orig', getValue($field));
      }
    };

    var checkForm = function (evt) {
      var isFieldDirty = function ($field) {
        var origValue = $field.data('ays-orig');
        if (undefined === origValue) {
          return false;
        }
        var itIsDirty = getValue($field) != origValue;
        if (itIsDirty) {
          $field.addClass(settings.dirtyClass);
        } else {
          $field.removeClass(settings.dirtyClass);
        }
        return itIsDirty;
      };

      var $form = $(this).is('form') ? $(this) : $(this).parents('form');

      // Test on the target first as it's the most likely to be dirty

      if (isFieldDirty($(evt.target))) {
        setDirtyStatus($form, true);
        return;
      }

      $fields = $form.find(settings.fieldSelector);

      // Brute force - check each field
      var isDirty = false;
      $fields.each(function () {
        var $field = $(this);
        if (isFieldDirty($field)) {
          isDirty = true;
          // Ya no se hace break, para que se corra isFieldDirty() en todos los fields. El motivo es que isFieldDirty() de paso agrega (o quita) una clase dirty en los campos.
          /* return false; // break */
        }
      });

      if (settings.addRemoveFieldsMarksDirty) {
        // Check if field count has changed
        var origCount = $form.data('ays-orig-field-count');
        if (origCount != $fields.length) {
          setDirtyStatus($form, true);
          return;
        }
      }

      setDirtyStatus($form, isDirty);
    };

    var initForm = function ($form) {
      var fields = $form.find(settings.fieldSelector);
      $(fields).each(function () {
        storeOrigValue($(this));
      });
      $(fields).unbind(settings.fieldEvents, checkForm);
      $(fields).bind(settings.fieldEvents, checkForm);
      $form.data('ays-orig-field-count', $(fields).length);
      setDirtyStatus($form, false);
    };

    var setDirtyStatus = function ($form, isDirty) {
      var changed = isDirty != $form.hasClass(settings.dirtyClass);
      $form.toggleClass(settings.dirtyClass, isDirty);

      // Fire change event if required
      if (changed) {
        if (settings.change) settings.change.call($form, $form);

        if (isDirty) $form.trigger('dirty.areYouSure', [$form]);
        if (!isDirty) $form.trigger('clean.areYouSure', [$form]);
        $form.trigger('change.areYouSure', [$form]);
      }
    };

    var rescan = function () {
      var $form = $(this);
      var fields = $form.find(settings.fieldSelector);
      $(fields).each(function () {
        var $field = $(this);
        if (typeof $field.data('ays-orig') == 'undefined') {
          storeOrigValue($field);
          $field.bind(settings.fieldEvents, checkForm);
        }
      });
      // Check for changes while we're here
      $form.trigger('checkform.areYouSure');
    };

    var reinitialize = function () {
      initForm($(this));
    };

    if (!settings.silent && !window.aysUnloadSet) {
      window.aysUnloadSet = true;
      $(window).bind('beforeunload', function () {
        $dirtyForms = $('form').filter('.' + settings.dirtyClass);
        if ($dirtyForms.length == 0) {
          return;
        }
        // Prevent multiple prompts - seen on Chrome and IE
        if (navigator.userAgent.toLowerCase().match(/msie|chrome/)) {
          if (window.aysHasPrompted) {
            return;
          }
          window.aysHasPrompted = true;
          window.setTimeout(function () {
            window.aysHasPrompted = false;
          }, 900);
        }
        return settings.message;
      });
    }

    return this.each(function (elem) {
      if (!$(this).is('form')) {
        return;
      }
      var $form = $(this);

      if (settings.removeDirtyClassAtSubmit) {
        $form.submit(function () {
          console.log('$form.removeClass');
          $form.removeClass(settings.dirtyClass);
        });
      }
      $form.bind('reset', function () {
        setDirtyStatus($form, false);
      });
      // Add a custom events
      $form.bind('rescan.areYouSure', rescan);
      $form.bind('reinitialize.areYouSure', reinitialize);
      $form.bind('checkform.areYouSure', checkForm);
      initForm($form);
    });
  };
})(jQuery);
