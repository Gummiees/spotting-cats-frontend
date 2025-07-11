import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Navbar } from "@shared/components/navbar/navbar";
import { AuthStateService } from "@shared/services/auth-state.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Navbar],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App implements OnInit {
  constructor(private authStateService: AuthStateService) {}

  async ngOnInit() {
    await this.authStateService.checkAuthStatus();
  }
}
