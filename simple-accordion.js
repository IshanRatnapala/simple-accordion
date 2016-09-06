define([
    'jquery',
    'utility',
    'jquery/ui'
], function ($, utility) {
    'use strict';

    $.widget('drgz.simpleAccordion', {
        options: {
            headerSelector: '.title',
            headerClass: 'title-ns', /* Unique class the plugin uses to identify elements. Recommend not changing. */
            contentSelector: '.submenu',
            contentClass: 'submenu-ns', /* Unique class the plugin uses to identify elements. Recommend not changing. */
            slideSpeed: 250,
            activeClass: 'active',
            activeElements: false, /* An array of indexes. ex: [0] */
            multipleCollapsible: false,
            disableForDesktop: false,
            disableForMobile: false,
            onlyForDesktop: false,
            onlyForMobile: false,
            disableAnimation: false,
            disableJQAnimation: false,
            mobileOptions: {},
            searchForNestedSections: true, /* Automatically looks for nested sections */
            fluid: true, /* Set options automatically on mobile | desktop breakpoint changes */ /*TODO*/
            rememberState: false, /* Remembers states between refreshes */
            smartMode: false, /* Automatically looks for suitable headers and footers */
            debugMode: false
        },
        _create: function () {
            var self = this;

            if ((self.options.disableForDesktop && utility.isDesktop()) ||
                (self.options.disableForMobile && utility.isMobile()) ||
                (self.options.onlyForDesktop && !utility.isDesktop()) ||
                (self.options.onlyForMobile && !utility.isMobile())) {
                return;
            }

            self._checkBreakpoint();
            self._initialize();
            self._bindEvents();

        },

        _checkBreakpoint: function () {
            var self = this;
            if (utility.isMobile()) {
                for (var prop in self.options.mobileOptions) {
                    if (!self.options.mobileOptions.hasOwnProperty(prop)) {
                        /* The current property is not a direct property of prop */
                        continue;
                    }
                    self.options[prop] = self.options.mobileOptions[prop];
                }
            }
        },

        _initialize: function () {
            var self = this;

            self._assignRoles();

            /* Hide all content on load. */
            self.hideAll();

            if (self.options.rememberState) {
                self.storageVar = 'simple-accordion-' + self.element.attr('class').replace(/ /g,'-');
                self.savedState = sessionStorage[self.storageVar];
                /* Open active sections from session storage */
                if (self.savedState && self.savedState.length) {
                    self.options.activeElements = JSON.parse(self.savedState);
                }
            }

            if (self.options.activeElements) {
                /* activate active elements */
                self._openActiveElements();
            }
        },

        _assignRoles: function () {
            var self = this;

            self.header = self.element.find(self.options.headerSelector).addClass(self.options.headerClass);
            self.content = self.element.find(self.options.contentSelector).addClass(self.options.contentClass);

            if (!self.header.length || self.options.smartMode) {
                self.options.debugMode && console.warn('Accordion header sections not set');
                self.header = self.element.children().children(':first-child').addClass(self.options.headerClass);
                self.content = self.content.add(self.header.siblings().addClass(self.options.contentClass));
            }

            self.options.searchForNestedSections && self._checkForNestedSections(self.content);

        },

        _openActiveElements: function () {
            var self = this;
            self.options.activeElements.forEach(function(item) {
                var activeHeader = self.header.eq(item);
                if (activeHeader.length) {
                    self._toggleContent(true, activeHeader, true);
                }
            });
        },

        _checkForNestedSections: function (contentSection) {
            var self = this;
            contentSection.each(function () {
                $(this).children().each(function () {
                    var $this = $(this);
                    if ($this.children().length === 2) {
                        self.header = self.header.add($this.children(':first-child').addClass(self.options.headerClass));

                        var content = $this.children(':last-child').addClass(self.options.contentClass);
                        self._checkForNestedSections(content);
                        self.content = self.content.add(content);
                    }
                });
            });
        },

        _bindEvents: function () {
            var self = this;
            self.header.on('click.ns', function(event) {
                event.preventDefault();
                var $this = $(this);
                var eligibleHeaders;
                if (!$this.hasClass('active')) {
                    /* Show content */
                    self._toggleContent(true, $this, self.options.disableAnimation);
                    if (!self.options.multipleCollapsible) {
                        eligibleHeaders = $this.parent().siblings().find('.' + self.options.headerClass);
                        self._toggleContent(false, eligibleHeaders, self.options.disableAnimation);
                    }
                } else {
                    /* Hide content */
                    eligibleHeaders = $this.siblings().find('.' + self.options.headerClass).add($this);
                    self._toggleContent(false, eligibleHeaders, self.options.disableAnimation);
                }

                /* Save to session storage */
                if (self.options.rememberState) {
                    var activeHeaders = [];
                    self.header.each(function (index, element) {
                        if ($(element).hasClass('active')) {
                            activeHeaders.push(index);
                        }
                    });
                    sessionStorage[self.storageVar] = JSON.stringify(activeHeaders);
                }
            });
        },

        _toggleContent: function (action, headerElements, disableAnimation) {
            var self = this;
            headerElements.each(function() {
                var header = $(this);
                var content = header.siblings('.' + self.options.contentClass);

                if (!self.options.disableJQAnimation) {
                    if (disableAnimation) {
                        content
                            .stop()
                            [action ? 'show' : 'hide']();
                    } else {
                        content
                            .stop()
                            [action ? 'slideDown' : 'slideUp'](self.options.slideSpeed);
                    }
                }

                header.add(header.parent())[action ? 'addClass' : 'removeClass'](self.options.activeClass);
            });
        },

        showAll: function (disableAnimation) {
            var self = this;
            self._toggleContent(true, self.header, disableAnimation || self.options.activeClass);
        },

        showSection: function (index, disableAnimation) {
            var self = this;
            self._toggleContent(true, self.header.eq(index), disableAnimation || self.options.activeClass);
        },

        hideAll: function (disableAnimation) {
            var self = this;
            self._toggleContent(false, self.header, disableAnimation || self.options.activeClass);
        },

        destroy: function () {
            var self = this;
            self.header.off('click.ns');
            self.element.find('.' + self.options.headerClass).removeClass(self.options.headerClass);
            self.element.find('.' + self.options.contentClass).removeClass(self.options.contentClass);
        }
    });

    return $.drgz.simpleAccordion;
});
