/** =======================================================================
 * v1.4 (2018-07-09)
 * ========================================================================
 * Plugin para filtrar visualmente elementos ya existente en el DOM, mediante un input de texto como buscador.
 *
 * FORMA DE USO ----------------------------------------------------------
 * La idea es inicializar el plugin en algún input de texto a ser utilizado como buscador.
 * Ejemplo:
 * $('input.mi-buscador').arsisLiveSearch({
 *      targetElements: '.elementos-a-ser-buscados'
 * });
 *
 * OPCIONES --------------------------------------------------------------
 * NOMBRE                           POSIBLES VALORES        DEFAULT                 DESCRIPCIÓN
 * container:                       string                  "body"                  Selector. Contenedor dentro del cual va a actuar el plugin. Usar bien esto
 *                                                                                  para no, por ejemplo, filtrar elementos del DOM que no queremos tocar.
 * targetElements:                  string                  "li"                    Selector. El elemento que queremos esconder/filtrar con la búsqueda.
 * searchTextInThisChildElement:    string|false            false                   Selector. Usar esto si el texto no esta directamente dentro del targetElements
 *                                                                                  sino en un elemento hijo.
 * hideThisParentIfEmpty:           string|false            false                   Selector. Oculta el elemento padre si éste tiene todos sus targetElements hijas
 *                                                                                  ocultos. Mirar el ejemplo para entender mejor.
 * alwaysHideThisWhileSearching:    string|false            false                   Selector. Elemento adicionales que queremos que se oculten durante la búsqueda.
 *                                                                                  Puede ser particularmente útil al usar makeOpaqueInsteadOfHiding:true.
 * hiddenClass:                     string                  'hidden-by-searcher'    Clase que se agrega a los elemento que se ocultan.
 * shownClass:                      string                  'shown-by-searcher'     Clase que se agrega a los elemento que se hacen visibles (o se dejan visibles)
 *                                                                                  por cumplir con lo que se busca.
 * animationTime:                   int                     300                     Milisegundos. Self-explanatory.
 * makeOpaqueInsteadOfHiding:       boolean                 false                   Self-explanatory.
 * opacity:                         float                   0.4,                    Solo se aplica en caso de makeOpaqueInsteadOfHiding:true.
 * useFadeAnimation:                boolean                 false                   Self-explanatory. NO APLICA en el caso de makeOpaqueInsteadOfHiding:true.
 * scrollToFirstResult              boolean                 false                   Self-explanatory. Util al usar con makeOpaqueInsteadOfHiding:true.
 * searchOnCarriageReturn           boolean                 false                   El búsqueda al introducir la tecla Enter. Por default la búsqueda se realiza al
 *                                                                                  detectar cualquier tecla.
 * showNoResultElement              string|false            false                   Selector. Cuando no hay resultados, Hace que aparezca un elemento dado.
 * showNoResultPopover              boolean                 false                   Cuando no hay resultados, hace que aparezca un mensaje de "No se encontraron
 *                                                                                  resultados" en el input de búsqueda.
 * inputFiltersContainer            string|false            false                   Selector. (X) Para usar filtros de tipo input (checkbox o radio), especificar en
 *                                                                                  esta opción el contenedor de los inputs. También definir el atributo
 *                                                                                  data-als-tag-list en los elementos targetElements. La convención que se usa para
 *                                                                                  los "tags" es <input-name>--<input-value>. Los inputs con clase .als-ignore se
 *                                                                                  ignora. Los inputs con value vacío "" también se ignoran, eso se puede usar para
 *                                                                                  el famoso filtro de "todos los casos".
 *
 * FUNCIONES -------------------------------------------------------------
 * .arsisLiveSearch( 'hide', elementSelector ): Esconde (forzadamente) elementos según el selector proveído.
 * .arsisLiveSearch( 'show', elementSelector ): Hace visible (forzadamente) elementos según el selector proveído.
 * .arsisLiveSearch( 'triggerSearch' ): Dispara la búsqueda. Es la función que se dispara automáticamente con el evento keyup del input de búsqueda.
 */

(function ($) {
  /* =======================================================================
   * Función principal
   * =======================================================================*/
  $.fn.arsisLiveSearch = function (options, el) {
    return this.each(function () {
      var $searchInput = $(this);

      if (typeof options == 'object' && options) {
        // Si es un objeto entonces son las opciones definidas por el developer.
        // ESTO VIENE A SER LA INICIALIZACIÓN!
        settings = $.extend({}, $.fn.arsisLiveSearch.defaults, options);
        $searchInput.data('arsisLiveSearch.settings', settings);

        if (
          settings.makeOpaqueInsteadOfHiding &&
          settings.hideThisParentIfEmpty
        ) {
          // agrega una regla css para que evita que los elementos ocultos dentro de "padres" ocultos se hagan doblemente opacos.
          injectStyles(
            settings.container +
              ' .' +
              settings.hiddenClass +
              ' .' +
              settings.hiddenClass +
              '{opacity: 1!important;}',
          );
        }

        // Le asignamos el evento de keyup al input para que realice la búsqueda
        // y haga lo que tiene que hacer en cada caso.
        $searchInput.keyup(triggerSearch);
        if (settings.showNoResultPopover) {
          $searchInput.blur(function () {
            $searchInput.popover('destroy');
          });
        }

        // se esconde el elemento de no-results si es visible.
        if (settings.showNoResultElement) {
          hide(
            settings,
            $(settings.container).find(settings.showNoResultElement),
            true,
          );
        }

        if (settings.inputFiltersContainer) {
          $(settings.inputFiltersContainer)
            .find('input[name]')
            .not('.als-ignore')
            .change(function () {
              var e = $.Event('keyup');
              e.keyCode = 13; // Enter
              triggerSearch(e, $searchInput);
            });
        }
      } else if (typeof options == 'string') {
        var settings = $searchInput.data('arsisLiveSearch.settings');
        // Si es un string entonces es el nombre de un método.
        if (options === 'hide') {
          hide(settings, el);
        } else if (options === 'show') {
          show(settings, el);
        } else if (options === 'triggerSearch') {
          var e = $.Event('keyup');
          if (typeof el != 'undefined') {
            e.keyCode = el;
            triggerSearch(e, this);
          } else {
            e.keyCode = 13; // Enter
            triggerSearch(e, this);
          }
        }
      }
    });
  };

  /* =======================================================================
   * Método para hacer visible elemento.
   * =======================================================================*/
  function show(settings, el, removeSearcherClases) {
    removeSearcherClases =
      typeof removeSearcherClases !== 'undefined'
        ? removeSearcherClases
        : false;
    var $el = $(el);
    if ($el.hasClass(settings.hiddenClass)) {
      $el.removeClass(settings.hiddenClass).addClass(settings.shownClass);
      if (settings.makeOpaqueInsteadOfHiding) {
        $el.stop().fadeTo(settings.animationTime, 1);
      } else if (settings.useFadeAnimation) {
        $el.stop().fadeIn(settings.animationTime);
      } else {
        $el.stop().show(settings.animationTime);
      }
    } else {
      $el.addClass(settings.shownClass);
    }

    if (removeSearcherClases) {
      $el.removeClass(settings.hiddenClass).removeClass(settings.shownClass);
    }
  }

  /* =======================================================================
   * Método para esconder el elemento.
   * =======================================================================*/
  function hide(settings, el, isInstantaneous) {
    isInstantaneous =
      typeof isInstantaneous !== 'undefined' ? isInstantaneous : false;
    var $el = $(el);
    if (!$el.hasClass(settings.hiddenClass)) {
      $el.removeClass(settings.shownClass).addClass(settings.hiddenClass);
      if (isInstantaneous) {
        $el.stop().hide();
      } else if (settings.makeOpaqueInsteadOfHiding) {
        $el.stop().fadeTo(settings.animationTime, settings.opacity);
      } else if (settings.useFadeAnimation) {
        $el.stop().fadeOut(settings.animationTime);
      } else {
        $el.stop().hide(settings.animationTime);
      }
    }
  }

  /* =======================================================================
   * Método para matchear tags.
   * =======================================================================*/
  function matchWithFilters(inputFiltersContainer, $targetElement) {
    var $inputs = $(inputFiltersContainer)
      .find('input[name]')
      .not('.als-ignore')
      .filter(':checked');
    var targetTagList = $targetElement.data('als-tag-list').trim().split(/\s+/);

    var isMatch = true;
    $inputs.each(function () {
      var $input = $(this);
      var selectedTag = $input.val();
      if (selectedTag === '') {
        return;
      }
      selectedTag = $input.attr('name') + '--' + selectedTag;

      if (!isWordPresent(selectedTag, targetTagList)) {
        isMatch = false;
        return false;
      }
    });

    return isMatch;
  }

  /* =======================================================================
   * Método utilizado para filtrar los elementos.
   * =======================================================================*/
  function triggerSearch(event, searchEl) {
    var $searchInput;
    if (typeof searchEl != 'undefined') {
      $searchInput = $(searchEl);
    } else {
      $searchInput = $(this);
    }
    var settings = $searchInput.data('arsisLiveSearch.settings');

    if (
      settings.searchOnCarriageReturn &&
      event.keyCode !== 13 /*Carriage Return*/ &&
      event.keyCode !== 27 /*ESC*/
    ) {
      return;
    }

    $searchInput.addClass('searching');

    if (event.keyCode === 27) {
      $searchInput.blur();
      $searchInput.val('');
    }
    var wordsToBeSearched = $searchInput.val();
    var filterSelectedCount = 0;
    if (settings.inputFiltersContainer) {
      filterSelectedCount = $(settings.inputFiltersContainer)
        .find('input[name]')
        .not('.als-ignore')
        .filter(':checked').length;
    }
    if (filterSelectedCount == 0 && wordsToBeSearched.trim() === '') {
      // Dejar tudu como si no se estuviese usando el plugin (show a tudu lo oculto).

      if (settings.hideThisParentIfEmpty) {
        $(settings.container)
          .find(settings.hideThisParentIfEmpty)
          .each(function () {
            show(settings, this, true);
          });
      }
      if (settings.alwaysHideThisWhileSearching) {
        show(
          settings,
          $(settings.container).find(settings.alwaysHideThisWhileSearching),
          true,
        );
      }
      $(settings.container)
        .find(settings.targetElements)
        .each(function () {
          show(settings, this, true);
        });

      if (settings.showNoResultPopover) {
        $searchInput.popover('destroy');
      }

      if (settings.showNoResultElement) {
        hide(
          settings,
          $(settings.container).find(settings.showNoResultElement),
        );
      }
    } else {
      var wordList = wordsToBeSearched.trim().toLowerCase().split(/\s+/);
      // Se itera los elementos objetivos y, uno a uno,
      // se decide si ocultar, mostrar o dejar como está.

      /* ******************************************* */
      /*  ITERACIONES DE LOS ELEMENTOS OBJETIVOS     */

      if (settings.alwaysHideThisWhileSearching) {
        hide(
          settings,
          $(settings.container).find(settings.alwaysHideThisWhileSearching),
        );
      }

      $(settings.container)
        .find(settings.targetElements)
        .each(function () {
          var $targetElement = $(this);

          var targetText;
          if (settings.searchTextInThisChildElement) {
            targetText = $targetElement
              .find(settings.searchTextInThisChildElement)
              .text();
          } else {
            targetText = $targetElement.text();
          }

          var isMatch;

          if (settings.inputFiltersContainer) {
            isMatch =
              isAllWordsIncluded(wordList, targetText) &&
              matchWithFilters(settings.inputFiltersContainer, $targetElement);
          } else {
            isMatch = isAllWordsIncluded(wordList, targetText);
          }

          if (isMatch) {
            show(settings, $targetElement);
          } else {
            hide(settings, $targetElement);
          }
        });
      /*  FIN DE ITERACIONES                         */
      /* ******************************************* */

      // se esconden lo parents que tengan todos sus targetElements hijos escondidos.
      if (settings.hideThisParentIfEmpty) {
        $(settings.container)
          .find(settings.hideThisParentIfEmpty)
          .each(function () {
            var numberFound = $(this)
              .find(settings.targetElements)
              .not('.' + settings.hiddenClass).length;
            if (numberFound == 0) {
              hide(settings, this);
            }
            if (numberFound != 0) {
              show(settings, this);
            }
          });
      }

      var $firstResult = $(settings.container)
        .find(settings.targetElements)
        .filter('.' + settings.shownClass)
        .first();
      if ($firstResult.length) {
        if (settings.showNoResultPopover) {
          $searchInput.popover('destroy');
        }
        if (settings.showNoResultElement) {
          hide(
            settings,
            $(settings.container).find(settings.showNoResultElement),
          );
        }
        if (settings.scrollToFirstResult) {
          $('html, body').animate(
            {
              scrollTop: $firstResult.offset().top - 200,
            },
            700,
          );
        }
      } else {
        if (settings.showNoResultPopover) {
          $searchInput
            .popover({
              content: 'No se encontraron resultados',
              placement: 'bottom auto',
            })
            .popover('show');
        }
        if (settings.showNoResultElement) {
          show(
            settings,
            $(settings.container).find(settings.showNoResultElement),
          );
        }
      }
    }

    $searchInput.removeClass('searching');

    if ($searchInput.is('#main-searcher')) {
      setTimeout(function () {
        if ($searchInput.hasClass('searching')) {
          return;
        }

        $('.student-list-table').each(function () {
          let $table = $(this);
          let i = 0;
          $table.find('.row-count:visible').each(function () {
            i++;
            let $rowCountEl = $(this);
            $rowCountEl.text(i + ')');
          });
        });
      }, settings.animationTime + 50);
    }
  }

  /* =======================================================================
   * Opciones default del plugin
   * =======================================================================*/
  $.fn.arsisLiveSearch.defaults = {
    container: 'body',
    targetElements: 'li',
    searchTextInThisChildElement: false,
    hideThisParentIfEmpty: false,
    alwaysHideThisWhileSearching: false,
    hiddenClass: 'hidden-by-searcher',
    shownClass: 'shown-by-searcher',
    animationTime: 300,
    makeOpaqueInsteadOfHiding: false,
    opacity: 0.5, // Esto NO APLICA en el caso de makeOpaqueInsteadOfHiding false.
    useFadeAnimation: false, // Esto NO APLICA en el caso de makeOpaqueInsteadOfHiding true.
    scrollToFirstResult: false,
    searchOnCarriageReturn: false,
    showNoResultElement: false,
    showNoResultPopover: false,
    inputFiltersContainer: false,
    // Para futuro...
    //,ajaxCallback: false
    //,ajaxFilter: true
  };
})(jQuery);

/* =======================================================================
 * Función utilitaria. ACTUALMENTE EN DESUSO.
 * Retorna true si alguna palabra de wordsToBeSearched se encuentra incluida en targetText.
 * wordsToBeSearched puede ser un string, es decir, palabras separas por white-space o una
 * lista de palabras (strings).
 * =======================================================================*/
function isAnyWordIncluded(wordsToBeSearched, targetText) {
  var wordList;
  if (typeof wordsToBeSearched == 'string') {
    wordList = wordsToBeSearched.trim().toLowerCase().split(/\s+/);
  } else {
    wordList = wordsToBeSearched;
  }

  targetText = removeTildes(targetText);
  for (var i = 0; i < wordList.length; i++) {
    if (targetText.toLowerCase().indexOf(removeTildes(wordList[i])) != -1) {
      return true;
    }
  }
  return false;
}

/* =======================================================================
 * Función utilitaria.
 * Retorna true si todas las palabras de wordsToBeSearched se encuentra incluida en targetText.
 * wordsToBeSearched puede ser un string, es decir, palabras separas por white-space o una
 * lista de palabras (strings).
 * =======================================================================*/
function isAllWordsIncluded(wordsToBeSearched, targetText) {
  var wordList;
  if (typeof wordsToBeSearched == 'string') {
    wordList = wordsToBeSearched.trim().toLowerCase().split(/\s+/);
  } else {
    wordList = wordsToBeSearched;
  }

  targetText = removeTildes(targetText);
  for (var i = 0; i < wordList.length; i++) {
    if (targetText.toLowerCase().indexOf(removeTildes(wordList[i])) == -1) {
      return false;
    }
  }
  return true;
}

/* =======================================================================
 * Función utilitaria.
 * Retorna true si la palabra searchedWord está presente entre las palabras de targetWordList.
 * targetWordList puede ser un string, es decir, palabras separas por white-space o una
 * lista de palabras (strings).
 * =======================================================================*/
function isWordPresent(searchedWord, targetWordList) {
  if (typeof targetWordList == 'string') {
    targetWordList = targetWordList.trim().split(/\s+/);
  }

  for (var i = 0; i < targetWordList.length; i++) {
    if (targetWordList[i] === searchedWord) {
      return true;
    }
  }
  return false;
}

/* =======================================================================
 * Función utilitaria.
 * Agrega regla CSS al DOM.
 * =======================================================================*/
function injectStyles(rule) {
  var div = $('<div />', {
    html: '&shy;<style>' + rule + '</style>',
  }).appendTo('body');
}

var accentMap = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  Á: 'A',
  É: 'E',
  Í: 'I',
  Ó: 'O',
  Ú: 'U',
};
function removeTildes(text) {
  var toBeReturned = '';
  var charAtI;
  for (var i = 0; i < text.length; i++) {
    charAtI = text.charAt(i);
    toBeReturned += accentMap[charAtI] || charAtI;
  }
  return toBeReturned;
}
