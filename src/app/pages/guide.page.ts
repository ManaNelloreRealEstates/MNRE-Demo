import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ACTOR_GUIDES } from '../core/guide';
import { DEMO_PASSWORD } from '../core/format';

@Component({
  selector: 'app-guide-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="container">
        <p class="eyebrow">Demo guide</p>
        <h1>How each actor uses ManaNellore</h1>
        <p class="muted">Every account below uses the password <strong>{{ password }}</strong>. Log out before you switch actors. The same records move from one dashboard to the next.</p>
        <div class="guide-list">
          @for (actor of actors; track actor.role) {
            <article class="panel guide-card">
              <p class="eyebrow">{{ actor.title }}</p>
              <h2>{{ actor.person }}</h2>
              <p>{{ actor.summary }}</p>
              <p class="cred"><span>{{ actor.email }}</span><span>Password {{ actor.password }}</span></p>
              <ol>
                @for (step of actor.steps; track step) {
                  <li>{{ step }}</li>
                }
              </ol>
              <a class="btn btn-primary" routerLink="/login">Sign in as {{ actor.title }}</a>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class GuidePage {
  readonly actors = ACTOR_GUIDES;
  readonly password = DEMO_PASSWORD;

  constructor() {
    inject(Title).setTitle('Demo guide | ManaNelloreRealEstate');
  }
}
