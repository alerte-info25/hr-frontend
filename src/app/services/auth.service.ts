import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.developpement';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject = new BehaviorSubject<any>(
    JSON.parse(localStorage.getItem('user_token') || '{}')
  );

  user$ = this.userSubject.asObservable();
  private TOKEN_KEY = 'auth_token';
  private USER_KEY = 'user_token';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // Simulation du login pour l'instant (avant Laravel)
  login(data: any) {
    return this.http.post<any>(`${environment.apiUrl}login`, data)
      .pipe(
        tap(res => {
          if (res.token && res.user) {
            const userData = { ...res.user };
            delete userData.mdp;
            localStorage.setItem(this.TOKEN_KEY, res.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
          }
        })
      );
  }

  forgotPassword(data: { email: string }) {
    return this.http.post<any>(`${environment.apiUrl}forgot-password`, data);
  }

  changePassword(data: any) {
    return this.http.post(`${environment.apiUrl}change-password`, data);
  }
  changePhoto(data: any) {
    return this.http.post(`${environment.apiUrl}change-photo`, data);
  }


  // === MISE À JOUR LOCALE ===
  updateUserPhoto(photo: string) {
    const storedUser = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');

    if (storedUser?.employe) {
      storedUser.employe.photo = photo;

      localStorage.setItem(this.USER_KEY, JSON.stringify(storedUser));

      // notifie tous les composants abonnés (navbar, sidebar…)
      this.userSubject.next(storedUser);
    }
  }

  // getter pratique
  get currentUser() {
    return this.userSubject.value;
  }

  logout(): void {

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['connexion']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // Récupère le token pour l'interceptor
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Récupère les infos de l'utilisateur
  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  autoRegister(data:any){
    return this.http.post(`${environment.apiUrl}auto-register`, data);
  }

  isDG(): boolean {
    const role = this.getRole();
    return  role === 'rh'|| role === 'directeur';
  }

  isOnlyDG():boolean{
    const role = this.getRole();
    return role === 'directeur';
  }

  isEmploye(): boolean {
    return this.getRole() === 'employé' || this.getRole() === 'employe'|| this.getRole() === 'Employé';
  }

  getRole(): string {
    return this.getCurrentUser()?.role?.libelle?.toLowerCase() || '';
  }

  getCurrentUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}
