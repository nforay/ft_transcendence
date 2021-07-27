<template>
  <header>
    <md-toolbar>
      <md-icon md-src="assets/42logo.svg" />
      <h3 class="md-title" style="flex: 1">ft_transcendence</h3>
      <md-menu md-size="medium">
      <md-badge class="md-primary" md-content="12" md-menu-trigger>
        <md-avatar>
          <img class="avatar" src="../assets/avatar.jpg" alt="Avatar">
          <md-tooltip md-direction="left">user login</md-tooltip>
        </md-avatar>
      </md-badge>

      <md-menu-content>
        <md-menu-item>
          <md-icon>notifications</md-icon>
          <span>Notifications</span>
        </md-menu-item>

        <md-menu-item>
          <md-icon>settings</md-icon>
          <span>Settings</span>
        </md-menu-item>

        <md-menu-item>
          <md-icon>logout</md-icon>
          <span>Logout</span>
        </md-menu-item>
      </md-menu-content>
      </md-menu>
    </md-toolbar>
  </header>
</template>

<style scoped lang="scss">
.md-menu-item {
    margin: 12px;
}
.avatar {
  vertical-align: middle;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.md-toolbar + .md-toolbar {
    margin-top: 16px;
  }
</style>
