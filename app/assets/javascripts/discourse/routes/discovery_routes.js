function buildTopicRoute(filter) {
  return Discourse.Route.extend({
    renderTemplate: function() {
      this.render('navigation/default', { outlet: 'navigation-bar' });
      this.render('discovery/topics', { controller: 'discoveryTopics', outlet: 'list-container' });
    },

    model: function() {
      return Discourse.TopicList.list(filter).then(function(list) {
        var tracking = Discourse.TopicTrackingState.current();
        if (tracking) {
          tracking.sync(list, filter);
          tracking.trackIncoming(filter);
        }
        return list;
      });
    },

    setupController: function(controller, model) {
      this.controllerFor('discoveryTopics').set('model', model);
      this.controllerFor('navigationDefault').set('filterMode', filter);
    },

    afterModel: function() {
      this.controllerFor('discovery').set('loading', false);
    },

    actions: {
      loading: function() {
        this.controllerFor('discovery').set('loading', true);
      }
    }
  });
}

Discourse.DiscoveryCategoriesRoute = Discourse.Route.extend({

  renderTemplate: function() {
    this.render('navigation/default', { outlet: 'navigation-bar' });
    this.render('discovery/categories', { outlet: 'list-container' });
  },

  model: function() {
    return Discourse.CategoryList.list('categories').then(function(list) {
      var tracking = Discourse.TopicTrackingState.current();
      if (tracking) {
        tracking.sync(list, 'categories');
        tracking.trackIncoming('categories');
      }
      return list;
    });
  } 
});

Discourse.DiscoveryController = Em.Controller.extend({});

Discourse.ListController.FILTERS.forEach(function(filter) {
  Discourse["Discovery" + filter.capitalize() + "Route"] = buildTopicRoute(filter);
});

Discourse.NavigationDefaultController = Discourse.Controller.extend({
  categories: function() {
    return Discourse.Category.list();
  }.property(),

  navItems: function() {
    return Discourse.NavItem.buildList();
  }.property() 
});

Discourse.DiscoveryTopicsController = Discourse.ObjectController.extend({

  actions: {
    // Star a topic
    toggleStar: function(topic) {
      topic.toggleStar();
    },

    // clear a pinned topic
    clearPin: function(topic) {
      topic.clearPin();
    },

    createTopic: function() {
      this.get('controllers.list').send('createTopic');
    },

    // Show newly inserted topics
    showInserted: function() {
      var tracker = Discourse.TopicTrackingState.current();

      // Move inserted into topics
      this.get('content').loadBefore(tracker.get('newIncoming'));
      tracker.resetTracking();
      return false;
    }
  },

  topicTrackingState: function() {
    return Discourse.TopicTrackingState.current();
  }.property() 
});
