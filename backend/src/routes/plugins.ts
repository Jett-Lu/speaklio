import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabase.js";

export const pluginsRouter = Router();

const pluginSelect = "id, name, description, icon, is_active, created_at";

function toPluginResponse(plugin: Record<string, unknown>, enabled: boolean) {
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    icon: plugin.icon,
    isActive: plugin.is_active,
    createdAt: plugin.created_at,
    enabled,
  };
}

async function loadActivePlugin(pluginId: string) {
  return supabaseAdmin
    .from("plugins")
    .select(pluginSelect)
    .eq("id", pluginId)
    .eq("is_active", true)
    .maybeSingle();
}

pluginsRouter.get("/", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const [{ data: plugins, error: pluginsError }, { data: settings, error: settingsError }] = await Promise.all([
      supabaseAdmin
        .from("plugins")
        .select(pluginSelect)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("user_plugins")
        .select("plugin_id, enabled")
        .eq("user_id", user.id),
    ]);

    if (pluginsError || settingsError) {
      response.status(500).json({
        error: "Unable to load plugins",
        message: pluginsError?.message ?? settingsError?.message,
      });
      return;
    }

    const enabledByPluginId = new Map((settings ?? []).map((setting) => [setting.plugin_id, setting.enabled]));

    response.json({
      plugins: (plugins ?? []).map((plugin) => toPluginResponse(plugin, enabledByPluginId.get(plugin.id) === true)),
    });
  } catch (error) {
    next(error);
  }
});

pluginsRouter.put("/:pluginId/enable", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const pluginId = String(request.params.pluginId);
    const { data: plugin, error: pluginError } = await loadActivePlugin(pluginId);

    if (pluginError) {
      response.status(500).json({
        error: "Unable to load plugin",
        message: pluginError.message,
      });
      return;
    }

    if (!plugin) {
      response.status(404).json({
        error: "Plugin not found",
      });
      return;
    }

    const { error } = await supabaseAdmin
      .from("user_plugins")
      .upsert({
        user_id: user.id,
        plugin_id: pluginId,
        enabled: true,
      });

    if (error) {
      response.status(500).json({
        error: "Unable to enable plugin",
        message: error.message,
      });
      return;
    }

    response.json({
      plugin: toPluginResponse(plugin, true),
    });
  } catch (error) {
    next(error);
  }
});

pluginsRouter.delete("/:pluginId/enable", requireAuth, async (request, response, next) => {
  try {
    const { user } = request as AuthenticatedRequest;
    const pluginId = String(request.params.pluginId);
    const { data: plugin, error: pluginError } = await loadActivePlugin(pluginId);

    if (pluginError) {
      response.status(500).json({
        error: "Unable to load plugin",
        message: pluginError.message,
      });
      return;
    }

    if (!plugin) {
      response.status(404).json({
        error: "Plugin not found",
      });
      return;
    }

    const { error } = await supabaseAdmin
      .from("user_plugins")
      .upsert({
        user_id: user.id,
        plugin_id: pluginId,
        enabled: false,
      });

    if (error) {
      response.status(500).json({
        error: "Unable to disable plugin",
        message: error.message,
      });
      return;
    }

    response.json({
      plugin: toPluginResponse(plugin, false),
    });
  } catch (error) {
    next(error);
  }
});
